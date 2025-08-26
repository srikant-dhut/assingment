const { Exam, examSchemaValidation } = require("../../moduals/ExamModel");
const { Batch } = require("../../moduals/BatchModel");
const { User } = require("../../moduals/UserModel");
const { StatusCodes } = require("../../helper/httpsStatusCode");

// Create Exam (Admin/Teacher)
const createExam = async (req, res) => {
  try {
    const { error, value } = examSchemaValidation.validate(req.body);
    if (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Validation error",
        error: error.details[0].message,
      });
    }

    const { batchId } = value;

    // Verify batch exists
    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Batch not found",
      });
    }

    // Check if user is admin or assigned teacher for this batch
    if (req.user.role === 'teacher' && batch.assignedTeacher.toString() !== req.user.id) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "You can only create exams for batches assigned to you",
      });
    }

    const examData = {
      ...value,
      createdBy: req.user.id,
    };

    const exam = new Exam(examData);
    await exam.save();

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Exam created successfully",
      data: exam,
    });
  } catch (error) {
    console.error("Create exam error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Assign Marks to Students (Teacher)
const assignMarks = async (req, res) => {
  try {
    const { examId } = req.params;
    const { results } = req.body;

    if (!results || !Array.isArray(results) || results.length === 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Results array is required",
      });
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Exam not found",
      });
    }

    // Check if user is admin or assigned teacher for this batch
    const batch = await Batch.findById(exam.batchId);
    if (req.user.role === 'teacher' && batch.assignedTeacher.toString() !== req.user.id) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "You can only assign marks for exams in batches assigned to you",
      });
    }

    // Validate and process results
    const processedResults = results.map(result => {
      const { studentId, marksObtained, remarks } = result;
      
      // Calculate percentage
      const percentage = Math.round((marksObtained / exam.totalMarks) * 100);
      
      // Determine grade
      let grade = 'F';
      if (percentage >= 90) grade = 'A+';
      else if (percentage >= 80) grade = 'A';
      else if (percentage >= 70) grade = 'B+';
      else if (percentage >= 60) grade = 'B';
      else if (percentage >= 50) grade = 'C+';
      else if (percentage >= 40) grade = 'C';
      else if (percentage >= 30) grade = 'D';

      return {
        studentId,
        marksObtained,
        percentage,
        grade,
        remarks,
        submittedAt: new Date()
      };
    });

    // Calculate exam statistics
    const totalMarks = processedResults.reduce((sum, result) => sum + result.marksObtained, 0);
    const averageScore = Math.round(totalMarks / processedResults.length);
    const highestScore = Math.max(...processedResults.map(r => r.marksObtained));
    const lowestScore = Math.min(...processedResults.map(r => r.marksObtained));

    // Update exam with results and statistics
    const updatedExam = await Exam.findByIdAndUpdate(
      examId,
      {
        results: processedResults,
        averageScore,
        highestScore,
        lowestScore,
        status: 'completed'
      },
      { new: true }
    ).populate('results.studentId', 'name email studentId');

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Marks assigned successfully",
      data: {
        exam: updatedExam,
        summary: {
          totalStudents: processedResults.length,
          averageScore,
          highestScore,
          lowestScore,
          passPercentage: Math.round((processedResults.filter(r => r.percentage >= exam.passingMarks).length / processedResults.length) * 100)
        }
      }
    });
  } catch (error) {
    console.error("Assign marks error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Fetch Exam Results (Student/Teacher)
const fetchExamResults = async (req, res) => {
  try {
    const { examId, studentId, batchId } = req.query;

    let query = {};

    if (examId) {
      query._id = examId;
    }

    if (batchId) {
      query.batchId = batchId;
    }

    // If student is viewing their own results
    if (req.user.role === 'student') {
      query['results.studentId'] = req.user.id;
    }

    // If teacher is viewing results for their batch
    if (req.user.role === 'teacher' && batchId) {
      const batch = await Batch.findById(batchId);
      if (batch && batch.assignedTeacher.toString() !== req.user.id) {
        return res.status(StatusCodes.FORBIDDEN).json({
          success: false,
          message: "You can only view results for exams in batches assigned to you",
        });
      }
    }

    const exams = await Exam.find(query)
      .populate('batchId', 'name')
      .populate('createdBy', 'name email')
      .populate('results.studentId', 'name email studentId')
      .sort({ examDate: -1 });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Exam results retrieved successfully",
      data: exams,
    });
  } catch (error) {
    console.error("Fetch exam results error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Update Exam Details (Teacher)
const updateExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated
    delete updateData.createdBy;
    delete updateData.results;
    delete updateData.averageScore;
    delete updateData.highestScore;
    delete updateData.lowestScore;

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Exam not found",
      });
    }

    // Check if user is admin or assigned teacher for this batch
    const batch = await Batch.findById(exam.batchId);
    if (req.user.role === 'teacher' && batch.assignedTeacher.toString() !== req.user.id) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "You can only update exams in batches assigned to you",
      });
    }

    // Check if exam is completed (has results)
    if (exam.results && exam.results.length > 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Cannot update exam details after results are published",
      });
    }

    const updatedExam = await Exam.findByIdAndUpdate(
      examId,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Exam updated successfully",
      data: updatedExam,
    });
  } catch (error) {
    console.error("Update exam error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Delete Exam (Admin/Teacher)
const deleteExam = async (req, res) => {
  try {
    const { examId } = req.params;

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Exam not found",
      });
    }

    // Check if user is admin or assigned teacher for this batch
    const batch = await Batch.findById(exam.batchId);
    if (req.user.role === 'teacher' && batch.assignedTeacher.toString() !== req.user.id) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "You can only delete exams in batches assigned to you",
      });
    }

    // Check if exam has results
    if (exam.results && exam.results.length > 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Cannot delete exam with published results",
      });
    }

    await Exam.findByIdAndDelete(examId);

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Exam deleted successfully",
    });
  } catch (error) {
    console.error("Delete exam error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get Exam by ID
const getExamById = async (req, res) => {
  try {
    const { examId } = req.params;

    const exam = await Exam.findById(examId)
      .populate('batchId', 'name')
      .populate('createdBy', 'name email')
      .populate('results.studentId', 'name email studentId');

    if (!exam) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Exam not found",
      });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Exam retrieved successfully",
      data: exam,
    });
  } catch (error) {
    console.error("Get exam error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// List Exams
const listExams = async (req, res) => {
  try {
    const { 
      batchId, 
      examType, 
      status, 
      startDate, 
      endDate, 
      page = 1, 
      limit = 10 
    } = req.query;

    const skip = (page - 1) * limit;

    // Build query
    let query = {};
    
    if (batchId) {
      query.batchId = batchId;
    }

    if (examType) {
      query.examType = examType;
    }

    if (status) {
      query.status = status;
    }

    if (startDate && endDate) {
      query.examDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const exams = await Exam.find(query)
      .populate('batchId', 'name')
      .populate('createdBy', 'name email')
      .sort({ examDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalExams = await Exam.countDocuments(query);

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Exams retrieved successfully",
      data: {
        exams,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalExams / limit),
          totalExams,
          hasNextPage: page * limit < totalExams,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error("List exams error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  createExam,
  assignMarks,
  fetchExamResults,
  updateExam,
  deleteExam,
  getExamById,
  listExams,
};
