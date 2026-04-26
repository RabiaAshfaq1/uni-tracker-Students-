const prisma = require('../utils/prisma');

function calculateGPA(totalMarks) {
  if (totalMarks >= 90) return { points: 4.0, letter: 'A+' };
  if (totalMarks >= 85) return { points: 4.0, letter: 'A'  };
  if (totalMarks >= 80) return { points: 3.7, letter: 'A-' };
  if (totalMarks >= 75) return { points: 3.3, letter: 'B+' };
  if (totalMarks >= 71) return { points: 3.0, letter: 'B'  };
  if (totalMarks >= 68) return { points: 2.7, letter: 'B-' };
  if (totalMarks >= 64) return { points: 2.3, letter: 'C+' };
  if (totalMarks >= 61) return { points: 2.0, letter: 'C'  };
  if (totalMarks >= 58) return { points: 1.7, letter: 'C-' };
  if (totalMarks >= 54) return { points: 1.3, letter: 'D+' };
  if (totalMarks >= 50) return { points: 1.0, letter: 'D'  };
  return { points: 0.0, letter: 'F' };
}

function calculateTotalMarks(gradeData, hasLab) {
  const quizzes = [gradeData.quiz_1, gradeData.quiz_2, gradeData.quiz_3, gradeData.quiz_4, gradeData.quiz_5].filter(q => q != null);
  const assignments = [gradeData.assign_1, gradeData.assign_2, gradeData.assign_3, gradeData.assign_4, gradeData.assign_5].filter(a => a != null);
  const labAssignments = [gradeData.lab_assign_1, gradeData.lab_assign_2, gradeData.lab_assign_3].filter(la => la != null);

  let quizMarks = quizzes.length > 0 ? Math.max(...quizzes) : null;
  let assignMarks = assignments.length > 0 ? assignments.reduce((a, b) => a + b, 0) / assignments.length : null;
  let labAssignMarks = labAssignments.length > 0 ? labAssignments.reduce((a, b) => a + b, 0) / labAssignments.length : null;

  let midMarks = gradeData.mid != null ? gradeData.mid : null;
  let labMidMarks = gradeData.lab_mid != null ? gradeData.lab_mid : null;
  let finalMarks = gradeData.final != null ? gradeData.final : null;

  // Base weights
  let weights = {
    quiz: { available: quizMarks != null, weight: 10, value: quizMarks },
    assign: { available: assignMarks != null, weight: 10, value: assignMarks },
    labAssign: { available: hasLab && labAssignMarks != null, weight: hasLab ? 10 : 0, value: labAssignMarks },
    mid: { available: midMarks != null, weight: hasLab ? 25 : 30, value: midMarks },
    labMid: { available: hasLab && labMidMarks != null, weight: hasLab ? 10 : 0, value: labMidMarks },
    final: { available: finalMarks != null, weight: hasLab ? 40 : 45, value: finalMarks }
  };

  let totalAvailableWeight = 0;
  for (let key in weights) {
    if (weights[key].available) {
      totalAvailableWeight += weights[key].weight;
    }
  }

  if (totalAvailableWeight === 0) return null;

  let totalScore = 0;
  for (let key in weights) {
    if (weights[key].available) {
      let redistributedWeight = (weights[key].weight / totalAvailableWeight) * 100;
      totalScore += (weights[key].value * redistributedWeight) / 100;
    }
  }

  return totalScore;
}

const getGrades = async (req, res, next) => {
  try {
    const { subjectId } = req.params;
    const subId = parseInt(subjectId);

    const subject = await prisma.subject.findUnique({
      where: { id: subId },
      include: { semester: true }
    });

    if (!subject || subject.semester.user_id !== req.user.userId) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    const grades = await prisma.grade.findUnique({
      where: { subject_id: subId }
    });
    
    res.json(grades || {});
  } catch (error) {
    next(error);
  }
};

const createOrUpdateGrades = async (req, res, next) => {
  try {
    const { subjectId } = req.params;
    const subId = parseInt(subjectId);
    
    const subject = await prisma.subject.findUnique({
      where: { id: subId },
      include: { semester: true }
    });

    if (!subject || subject.semester.user_id !== req.user.userId) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    const gradeData = {
      quiz_1: req.body.quiz_1, quiz_2: req.body.quiz_2, quiz_3: req.body.quiz_3, quiz_4: req.body.quiz_4, quiz_5: req.body.quiz_5,
      assign_1: req.body.assign_1, assign_2: req.body.assign_2, assign_3: req.body.assign_3, assign_4: req.body.assign_4, assign_5: req.body.assign_5,
      lab_assign_1: req.body.lab_assign_1, lab_assign_2: req.body.lab_assign_2, lab_assign_3: req.body.lab_assign_3,
      mid: req.body.mid, lab_mid: req.body.lab_mid, final: req.body.final
    };

    // Replace undefined with null for Prisma
    for (const key in gradeData) {
      if (gradeData[key] === undefined) gradeData[key] = null;
    }

    const hasLab = gradeData.lab_assign_1 != null || gradeData.lab_assign_2 != null || gradeData.lab_assign_3 != null || gradeData.lab_mid != null;
    const totalMarks = calculateTotalMarks(gradeData, hasLab);
    
    let gradePoint = null;
    let letterGrade = null;

    if (totalMarks !== null) {
      const gpa = calculateGPA(totalMarks);
      gradePoint = gpa.points;
      letterGrade = gpa.letter;
    }

    const grades = await prisma.grade.upsert({
      where: { subject_id: subId },
      update: { ...gradeData, total_marks: totalMarks, grade_point: gradePoint, letter_grade: letterGrade },
      create: {
        subject: { connect: { id: subId } },
        ...gradeData,
        total_marks: totalMarks,
        grade_point: gradePoint,
        letter_grade: letterGrade
      }
    });

    res.json(grades);
  } catch (error) {
    next(error);
  }
};

const getSemesterGPA = async (req, res, next) => {
  try {
    const { semesterId } = req.params;
    const semId = parseInt(semesterId);

    const semester = await prisma.semester.findUnique({
      where: { id: semId, user_id: req.user.userId },
      include: { subjects: { include: { grade: true } } }
    });

    if (!semester) return res.status(404).json({ error: 'Semester not found' });

    let totalPoints = 0;
    let totalCredits = 0;
    let subjectGrades = [];

    semester.subjects.forEach(sub => {
      const gPoint = sub.grade?.grade_point;
      const lGrade = sub.grade?.letter_grade;
      
      subjectGrades.push({
        name: sub.name,
        credits: sub.credit_hours,
        gradePoint: gPoint,
        letterGrade: lGrade
      });

      if (gPoint != null) {
        totalPoints += gPoint * sub.credit_hours;
        totalCredits += sub.credit_hours;
      }
    });

    const semesterGPA = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0;

    res.json({
      semesterGPA: parseFloat(semesterGPA),
      subjects: subjectGrades,
      totalCredits
    });

  } catch (error) {
    next(error);
  }
};

const getCGPA = async (req, res, next) => {
  try {
    const semesters = await prisma.semester.findMany({
      where: { user_id: req.user.userId },
      include: { subjects: { include: { grade: true } } }
    });

    let globalPoints = 0;
    let globalCredits = 0;
    let semesterData = [];
    let previousCGPA = null;
    let previousCredits = 0; // Assume 0 if not provided for calculation purpose

    semesters.forEach(sem => {
      if (sem.previous_cgpa) {
          previousCGPA = sem.previous_cgpa;
          // To integrate previous CGPA, we would ideally need previous total credits. 
          // If not available, we treat it as an isolated data point or average it.
          // Since the prompt specifies to include it as weighted average if we have previous credits,
          // but there is no previous_credits field, we will just pass it down for now.
      }

      let semPoints = 0;
      let semCredits = 0;

      sem.subjects.forEach(sub => {
        if (sub.grade && sub.grade.grade_point != null) {
          semPoints += sub.grade.grade_point * sub.credit_hours;
          semCredits += sub.credit_hours;
        }
      });

      globalPoints += semPoints;
      globalCredits += semCredits;

      semesterData.push({
        name: sem.title,
        gpa: semCredits > 0 ? parseFloat((semPoints / semCredits).toFixed(2)) : 0,
        credits: semCredits
      });
    });

    let cgpa = globalCredits > 0 ? (globalPoints / globalCredits).toFixed(2) : 0;

    // simplistic approach if previous CGPA exists but no credits: 
    // If we wanted true weighted, we'd need previous_credits in DB.
    if (previousCGPA && globalCredits > 0) {
       // Average them equally if no weights
       cgpa = ((parseFloat(cgpa) + previousCGPA) / 2).toFixed(2);
    } else if (previousCGPA && globalCredits === 0) {
       cgpa = previousCGPA.toFixed(2);
    }

    res.json({
      cgpa: parseFloat(cgpa),
      semesters: semesterData,
      previousCGPA,
      totalCredits: globalCredits
    });

  } catch (error) {
    next(error);
  }
};

module.exports = { getGrades, createOrUpdateGrades, getSemesterGPA, getCGPA };
