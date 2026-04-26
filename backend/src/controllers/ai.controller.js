const Groq = require('groq-sdk');
const prisma = require('../utils/prisma');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Utility to calculate GPA based on marks
const calculateSubjectGpa = (marks) => {
  if (!marks) return 0;
  
  let totalObtained = 0;
  let totalMax = 0;

  if (marks.quiz_total) { totalObtained += marks.quiz_obtained; totalMax += marks.quiz_total; }
  if (marks.assignment_total) { totalObtained += marks.assignment_obtained; totalMax += marks.assignment_total; }
  if (marks.mid_total) { totalObtained += marks.mid_obtained; totalMax += marks.mid_total; }
  if (marks.final_total) { totalObtained += marks.final_obtained; totalMax += marks.final_total; }
  if (marks.lab_assignment_total) { totalObtained += marks.lab_assignment_obtained; totalMax += marks.lab_assignment_total; }
  if (marks.lab_mid_total) { totalObtained += marks.lab_mid_obtained; totalMax += marks.lab_mid_total; }

  if (totalMax === 0) return null; // No marks entered yet

  const percentage = (totalObtained / totalMax) * 100;
  
  // Standard scale
  if (percentage >= 85) return 4.0;
  if (percentage >= 80) return 3.7;
  if (percentage >= 75) return 3.3;
  if (percentage >= 71) return 3.0;
  if (percentage >= 68) return 2.7;
  if (percentage >= 64) return 2.3;
  if (percentage >= 61) return 2.0;
  if (percentage >= 58) return 1.7;
  if (percentage >= 50) return 1.0;
  return 0.0;
};

const getStudySuggestions = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    // Fetch user's active semester and subjects with tasks & marks
    const currentSemester = await prisma.semester.findFirst({
      where: { user_id: userId, is_current: true },
      include: {
        subjects: {
          include: {
            tasks: { where: { is_completed: false } },
            marks: true
          }
        }
      }
    });

    if (!currentSemester || currentSemester.subjects.length === 0) {
      return res.status(400).json({ error: 'No active semester or subjects found.' });
    }

    const payload = currentSemester.subjects.map(sub => {
      const gpa = calculateSubjectGpa(sub.marks);
      return {
        subject: sub.name,
        current_gpa: gpa !== null ? gpa.toFixed(2) : 'N/A',
        pending_tasks: sub.tasks.length,
        upcoming_deadlines: sub.tasks.map(t => ({ title: t.title, type: t.type, date: t.due_date }))
      };
    });

    const prompt = `
      You are an expert academic advisor. I am a university student.
      Here is my current academic status for this semester:
      ${JSON.stringify(payload, null, 2)}

      Analyze my current GPA and upcoming tasks.
      Return a JSON object strictly matching this schema:
      {
        "categorized_subjects": {
          "risky": ["Subject Names with GPA < 2.0"],
          "needs_attention": ["Subject Names with GPA 2.0-2.9"],
          "safe": ["Subject Names with GPA 3.0-3.4"],
          "excellent": ["Subject Names with GPA 3.5+"]
        },
        "study_advice": [
          { "subject": "Subject Name", "advice": "Specific, actionable advice." }
        ],
        "general_plan": "A short 2-3 sentence overview of what I should focus on."
      }
      Respond with ONLY the valid JSON, no markdown formatting blocks.
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama3-8b-8192',
      temperature: 0.5,
    });

    let suggestionText = chatCompletion.choices[0]?.message?.content || '{}';
    // Clean up potential markdown formatting from AI
    suggestionText = suggestionText.replace(/```json/g, '').replace(/```/g, '').trim();

    res.json(JSON.parse(suggestionText));
  } catch (error) {
    console.error('Groq AI Error:', error);
    next(error);
  }
};

const getGpaAdvice = async (req, res, next) => {
  try {
    const { subjects, semesterGPATarget, currentProjectedGPA } = req.body;

    const prompt = `
      You are an expert academic advisor. I am a university student.
      Here is my current academic status for this semester:
      Subjects: ${JSON.stringify(subjects, null, 2)}
      Semester target GPA: ${semesterGPATarget || 'None'}
      Current projected GPA: ${currentProjectedGPA || 'None'}

      Analyze my current GPA and upcoming tasks.
      Return a JSON object strictly matching this schema:
      {
        "overallRisk": "low|moderate|high|critical",
        "subjectAdvice": [
          { "subject": "Subject Name", "status": "safe|watch|risky|excellent", "advice": "Specific, actionable advice." }
        ],
        "topPriority": "Subject Name",
        "motivationalNote": "A short motivational sentence."
      }
      Respond with ONLY the valid JSON, no markdown formatting blocks.
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama3-8b-8192',
      temperature: 0.5,
    });

    let suggestionText = chatCompletion.choices[0]?.message?.content || '{}';
    suggestionText = suggestionText.replace(/```json/g, '').replace(/```/g, '').trim();

    res.json(JSON.parse(suggestionText));
  } catch (error) {
    console.error('Groq AI Error:', error);
    next(error);
  }
};

module.exports = { getStudySuggestions, getGpaAdvice };
