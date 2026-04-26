const prisma = require('../utils/prisma');

const getContent = async (req, res, next) => {
  try {
    const { subjectId } = req.params;
    const subId = parseInt(subjectId);

    // Verify ownership
    const subject = await prisma.subject.findUnique({
      where: { id: subId },
      include: { semester: true }
    });

    if (!subject || subject.semester.user_id !== req.user.userId) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    const content = await prisma.contentItem.findMany({
      where: { subject_id: subId },
      orderBy: { created_at: 'desc' }
    });
    res.json(content);
  } catch (error) {
    next(error);
  }
};

const createContent = async (req, res, next) => {
  try {
    const { subjectId } = req.params;
    const { type, title, url, description } = req.body;
    
    // If it's a file upload, multer will put the file URL in req.file.path
    const finalUrl = req.file ? req.file.path : url;
    
    // Simple extension checking to guess type if not provided
    let finalType = type;
    if (req.file && !type) {
      const ext = req.file.originalname.split('.').pop().toLowerCase();
      if (['pdf'].includes(ext)) finalType = 'pdf';
      else if (['doc', 'docx'].includes(ext)) finalType = 'doc';
      else if (['ppt', 'pptx'].includes(ext)) finalType = 'ppt';
      else finalType = 'note';
    }

    const subject = await prisma.subject.findUnique({
      where: { id: parseInt(subjectId) },
      include: { semester: true }
    });

    if (!subject || subject.semester.user_id !== req.user.userId) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    const contentItem = await prisma.contentItem.create({
      data: {
        subject: { connect: { id: parseInt(subjectId) } },
        type: finalType || 'note',
        title,
        url: finalUrl,
        description
      }
    });

    res.status(201).json(contentItem);
  } catch (error) {
    next(error);
  }
};

const updateContent = async (req, res, next) => {
  try {
    const { subjectId, id } = req.params;
    const { is_completed } = req.body;

    const contentItem = await prisma.contentItem.findUnique({
      where: { id: parseInt(id) },
      include: { subject: { include: { semester: true } } }
    });

    if (!contentItem || contentItem.subject.semester.user_id !== req.user.userId || contentItem.subject_id !== parseInt(subjectId)) {
      return res.status(404).json({ error: 'Content not found' });
    }

    const updated = await prisma.contentItem.update({
      where: { id: parseInt(id) },
      data: { is_completed }
    });
    
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

const deleteContent = async (req, res, next) => {
  try {
    const { subjectId, id } = req.params;
    const matId = parseInt(id);

    const contentItem = await prisma.contentItem.findUnique({
      where: { id: matId },
      include: { subject: { include: { semester: true } } }
    });

    if (!contentItem || contentItem.subject.semester.user_id !== req.user.userId || contentItem.subject_id !== parseInt(subjectId)) {
      return res.status(404).json({ error: 'Content not found' });
    }

    await prisma.contentItem.delete({
      where: { id: matId }
    });
    
    res.json({ message: 'Content deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getContent, createContent, updateContent, deleteContent };
