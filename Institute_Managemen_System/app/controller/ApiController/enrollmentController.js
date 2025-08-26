const { Enrollment, enrollmentSchemaValidation } = require("../../moduals/EnrollmentModel");
const { Course } = require("../../moduals/CourseModel");
const { Batch } = require("../../moduals/BatchModel");
const { User } = require("../../moduals/UserModel");
const { StatusCodes } = require("../../helper/httpsStatusCode");

// Enroll Student into a Course
const enrollStudent = async (req, res) => {
  try {
    const { error, value } = enrollmentSchemaValidation.validate(req.body);
    if (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Validation error",
        error: error.details[0].message,
      });
    }

    const { studentId, courseId, batchId, totalAmount } = value;

    // Verify student exists and has student role
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Invalid student ID or user is not a student",
      });
    }

    // Verify course exists and is active
    const course = await Course.findById(courseId);
    if (!course || !course.isActive) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Course not found or inactive",
      });
    }

    // Verify batch exists and belongs to the course
    const batch = await Batch.findById(batchId);
    if (!batch || batch.courseId.toString() !== courseId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Invalid batch ID or batch doesn't belong to the course",
      });
    }

    // Check if batch has capacity
    if (batch.currentStudents >= batch.maxStudents) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Batch is full",
      });
    }

    // Check if student is already enrolled in this course and batch
    const existingEnrollment = await Enrollment.findOne({
      studentId,
      courseId,
      batchId,
      status: { $in: ['active', 'completed'] }
    });

    if (existingEnrollment) {
      return res.status(StatusCodes.CONFLICT).json({
        success: false,
        message: "Student is already enrolled in this course and batch",
      });
    }

    // Create enrollment
    const enrollment = new Enrollment({
      ...value,
      enrollmentDate: new Date(),
      status: 'active',
      paymentStatus: 'pending'
    });

    await enrollment.save();

    // Update batch current students count
    await Batch.findByIdAndUpdate(batchId, {
      $inc: { currentStudents: 1 }
    });

    // Update course total enrollments count
    await Course.findByIdAndUpdate(courseId, {
      $inc: { totalEnrollments: 1 }
    });

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Student enrolled successfully",
      data: enrollment,
    });
  } catch (error) {
    console.error("Enroll student error:", error);
    
    if (error.code === 11000) {
      return res.status(StatusCodes.CONFLICT).json({
        success: false,
        message: "Student is already enrolled in this course and batch",
      });
    }

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get Student Enrollments
const getStudentEnrollments = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Check if user is viewing their own enrollments or is admin/teacher
    if (req.user.role === 'student' && req.user.id !== studentId) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "You can only view your own enrollments",
      });
    }

    let query = { studentId };

    if (status) {
      query.status = status;
    }

    const enrollments = await Enrollment.find(query)
      .populate('courseId', 'name description duration fees')
      .populate('batchId', 'name startDate endDate assignedTeacher')
      .populate('batchId.assignedTeacher', 'name email')
      .sort({ enrollmentDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalEnrollments = await Enrollment.countDocuments(query);

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Student enrollments retrieved successfully",
      data: {
        enrollments,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalEnrollments / limit),
          totalEnrollments,
          hasNextPage: page * limit < totalEnrollments,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error("Get student enrollments error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get Course Enrollments
const getCourseEnrollments = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let query = { courseId };

    if (status) {
      query.status = status;
    }

    const enrollments = await Enrollment.find(query)
      .populate('studentId', 'name email studentId')
      .populate('batchId', 'name startDate endDate')
      .sort({ enrollmentDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalEnrollments = await Enrollment.countDocuments(query);

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Course enrollments retrieved successfully",
      data: {
        enrollments,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalEnrollments / limit),
          totalEnrollments,
          hasNextPage: page * limit < totalEnrollments,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error("Get course enrollments error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Update Enrollment Status
const updateEnrollmentStatus = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const { status, paymentStatus, amountPaid, grade, remarks } = req.body;

    const enrollment = await Enrollment.findById(enrollmentId);
    if (!enrollment) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Enrollment not found",
      });
    }

    // Check if user has permission to update enrollment
    if (req.user.role === 'student' && enrollment.studentId.toString() !== req.user.id) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "You can only update your own enrollment",
      });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    if (amountPaid !== undefined) updateData.amountPaid = amountPaid;
    if (grade) updateData.grade = grade;
    if (remarks) updateData.remarks = remarks;

    // If enrollment is being completed, set completion date
    if (status === 'completed' && !enrollment.completionDate) {
      updateData.completionDate = new Date();
    }

    const updatedEnrollment = await Enrollment.findByIdAndUpdate(
      enrollmentId,
      updateData,
      { new: true }
    ).populate('courseId', 'name description')
      .populate('batchId', 'name startDate endDate')
      .populate('studentId', 'name email studentId');

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Enrollment updated successfully",
      data: updatedEnrollment,
    });
  } catch (error) {
    console.error("Update enrollment error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Cancel Enrollment
const cancelEnrollment = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const { reason } = req.body;

    const enrollment = await Enrollment.findById(enrollmentId);
    if (!enrollment) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Enrollment not found",
      });
    }

    // Check if user has permission to cancel enrollment
    if (req.user.role === 'student' && enrollment.studentId.toString() !== req.user.id) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "You can only cancel your own enrollment",
      });
    }

    // Check if enrollment can be cancelled
    if (enrollment.status === 'completed') {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Cannot cancel completed enrollment",
      });
    }

    // Update enrollment status
    enrollment.status = 'dropped';
    enrollment.remarks = reason || 'Enrollment cancelled by user';
    await enrollment.save();

    // Update batch current students count
    await Batch.findByIdAndUpdate(enrollment.batchId, {
      $inc: { currentStudents: -1 }
    });

    // Update course total enrollments count
    await Course.findByIdAndUpdate(enrollment.courseId, {
      $inc: { totalEnrollments: -1 }
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Enrollment cancelled successfully",
      data: enrollment,
    });
  } catch (error) {
    console.error("Cancel enrollment error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get Enrollment Statistics
const getEnrollmentStats = async (req, res) => {
  try {
    const { courseId, batchId, startDate, endDate } = req.query;

    let query = {};

    if (courseId) {
      query.courseId = courseId;
    }

    if (batchId) {
      query.batchId = batchId;
    }

    if (startDate && endDate) {
      query.enrollmentDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const enrollments = await Enrollment.find(query);

    // Calculate statistics
    const stats = {
      totalEnrollments: enrollments.length,
      activeEnrollments: enrollments.filter(e => e.status === 'active').length,
      completedEnrollments: enrollments.filter(e => e.status === 'completed').length,
      droppedEnrollments: enrollments.filter(e => e.status === 'dropped').length,
      suspendedEnrollments: enrollments.filter(e => e.status === 'suspended').length,
      paymentStats: {
        pending: enrollments.filter(e => e.paymentStatus === 'pending').length,
        partial: enrollments.filter(e => e.paymentStatus === 'partial').length,
        completed: enrollments.filter(e => e.paymentStatus === 'completed').length,
        failed: enrollments.filter(e => e.paymentStatus === 'failed').length
      },
      gradeDistribution: {
        'A+': enrollments.filter(e => e.grade === 'A+').length,
        'A': enrollments.filter(e => e.grade === 'A').length,
        'A-': enrollments.filter(e => e.grade === 'A-').length,
        'B+': enrollments.filter(e => e.grade === 'B+').length,
        'B': enrollments.filter(e => e.grade === 'B').length,
        'B-': enrollments.filter(e => e.grade === 'B-').length,
        'C+': enrollments.filter(e => e.grade === 'C+').length,
        'C': enrollments.filter(e => e.grade === 'C').length,
        'C-': enrollments.filter(e => e.grade === 'C-').length,
        'D': enrollments.filter(e => e.grade === 'D').length,
        'F': enrollments.filter(e => e.grade === 'F').length
      }
    };

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Enrollment statistics retrieved successfully",
      data: stats,
    });
  } catch (error) {
    console.error("Get enrollment stats error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  enrollStudent,
  getStudentEnrollments,
  getCourseEnrollments,
  updateEnrollmentStatus,
  cancelEnrollment,
  getEnrollmentStats,
};
