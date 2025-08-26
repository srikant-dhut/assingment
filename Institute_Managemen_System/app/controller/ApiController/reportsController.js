const { Course } = require("../../moduals/CourseModel");
const { Batch } = require("../../moduals/BatchModel");
const { Enrollment } = require("../../moduals/EnrollmentModel");
const { Attendance } = require("../../moduals/AttendanceModel");
const { Exam } = require("../../moduals/ExamModel");
const { User } = require("../../moduals/UserModel");
const { sendStudentReportEmail } = require("../../config/emailConfig");
const { StatusCodes } = require("../../helper/httpsStatusCode");

// List of Courses with Total Enrollments
const getCoursesWithEnrollments = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, isActive } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    
    if (category) {
      query.category = category;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const courses = await Course.find(query)
      .populate('createdBy', 'name email')
      .sort({ totalEnrollments: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalCourses = await Course.countDocuments(query);

    // Get detailed enrollment data for each course
    const coursesWithDetails = await Promise.all(
      courses.map(async (course) => {
        const enrollments = await Enrollment.find({ 
          courseId: course._id,
          status: { $in: ['active', 'completed'] }
        });

        const activeEnrollments = enrollments.filter(e => e.status === 'active').length;
        const completedEnrollments = enrollments.filter(e => e.status === 'completed').length;
        const totalRevenue = enrollments.reduce((sum, e) => sum + (e.amountPaid || 0), 0);

        return {
          ...course.toObject(),
          enrollmentDetails: {
            totalEnrollments: course.totalEnrollments,
            activeEnrollments,
            completedEnrollments,
            totalRevenue
          }
        };
      })
    );

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Courses with enrollments retrieved successfully",
      data: {
        courses: coursesWithDetails,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCourses / limit),
          totalCourses,
          hasNextPage: page * limit < totalCourses,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error("Get courses with enrollments error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Batch Performance Report (Admin/Teacher)
const getBatchPerformanceReport = async (req, res) => {
  try {
    const { batchId } = req.params;
    const { startDate, endDate } = req.query;

    const batch = await Batch.findById(batchId)
      .populate('courseId', 'name description')
      .populate('assignedTeacher', 'name email');

    if (!batch) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Batch not found",
      });
    }

    // Check if user has permission to view this batch report
    if (req.user.role === 'teacher' && batch.assignedTeacher.toString() !== req.user.id) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "You can only view reports for batches assigned to you",
      });
    }

    let dateQuery = {};
    if (startDate && endDate) {
      dateQuery = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Get attendance data
    const attendanceRecords = await Attendance.find({
      batchId,
      date: dateQuery
    });

    // Get exam data
    const exams = await Exam.find({
      batchId,
      status: 'completed'
    });

    // Get enrollment data
    const enrollments = await Enrollment.find({
      batchId,
      status: { $in: ['active', 'completed'] }
    });

    // Calculate attendance statistics
    let totalAttendanceDays = 0;
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalLate = 0;
    let totalExcused = 0;

    attendanceRecords.forEach(record => {
      totalAttendanceDays++;
      totalPresent += record.presentCount;
      totalAbsent += record.absentCount;
      totalLate += record.lateCount;
      totalExcused += record.excusedCount;
    });

    const overallAttendancePercentage = totalAttendanceDays > 0 
      ? Math.round(((totalPresent + totalLate) / (totalAttendanceDays * batch.currentStudents)) * 100)
      : 0;

    // Calculate exam performance
    let totalExams = 0;
    let totalMarks = 0;
    let totalStudents = 0;
    let passCount = 0;

    exams.forEach(exam => {
      totalExams++;
      exam.results.forEach(result => {
        totalMarks += result.marksObtained;
        totalStudents++;
        if (result.percentage >= exam.passingMarks) {
          passCount++;
        }
      });
    });

    const averageExamScore = totalStudents > 0 ? Math.round(totalMarks / totalStudents) : 0;
    const passPercentage = totalStudents > 0 ? Math.round((passCount / totalStudents) * 100) : 0;

    // Calculate enrollment statistics
    const activeEnrollments = enrollments.filter(e => e.status === 'active').length;
    const completedEnrollments = enrollments.filter(e => e.status === 'completed').length;
    const completionRate = enrollments.length > 0 ? Math.round((completedEnrollments / enrollments.length) * 100) : 0;

    const report = {
      batch: {
        id: batch._id,
        name: batch.name,
        course: batch.courseId,
        assignedTeacher: batch.assignedTeacher,
        startDate: batch.startDate,
        endDate: batch.endDate,
        status: batch.status,
        currentStudents: batch.currentStudents,
        maxStudents: batch.maxStudents
      },
      attendance: {
        totalDays: totalAttendanceDays,
        present: totalPresent,
        absent: totalAbsent,
        late: totalLate,
        excused: totalExcused,
        overallPercentage: `${overallAttendancePercentage}%`
      },
      exams: {
        totalExams,
        totalStudents,
        averageScore: averageExamScore,
        passPercentage: `${passPercentage}%`,
        passCount,
        failCount: totalStudents - passCount
      },
      enrollments: {
        total: enrollments.length,
        active: activeEnrollments,
        completed: completedEnrollments,
        completionRate: `${completionRate}%`
      },
      summary: {
        overallPerformance: Math.round((overallAttendancePercentage + passPercentage) / 2),
        recommendation: getPerformanceRecommendation(overallAttendancePercentage, passPercentage)
      }
    };

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Batch performance report generated successfully",
      data: report,
    });
  } catch (error) {
    console.error("Get batch performance report error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Student Performance Report
const getStudentPerformanceReport = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate } = req.query;

    // Check if user has permission to view this student report
    if (req.user.role === 'student' && req.user.id !== studentId) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "You can only view your own performance report",
      });
    }

    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Student not found",
      });
    }

    let dateQuery = {};
    if (startDate && endDate) {
      dateQuery = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Get student enrollments
    const enrollments = await Enrollment.find({
      studentId,
      status: { $in: ['active', 'completed'] }
    }).populate('courseId', 'name description duration')
      .populate('batchId', 'name startDate endDate assignedTeacher')
      .populate('batchId.assignedTeacher', 'name email');

    // Get attendance data for all batches
    const batchIds = enrollments.map(e => e.batchId._id);
    const attendanceRecords = await Attendance.find({
      batchId: { $in: batchIds },
      date: dateQuery,
      'students.studentId': studentId
    });

    // Get exam results for all batches
    const exams = await Exam.find({
      batchId: { $in: batchIds },
      status: 'completed',
      'results.studentId': studentId
    });

    // Calculate attendance statistics
    let totalDays = 0;
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalLate = 0;
    let totalExcused = 0;

    attendanceRecords.forEach(record => {
      const studentRecord = record.students.find(s => s.studentId.toString() === studentId);
      if (studentRecord) {
        totalDays++;
        switch (studentRecord.status) {
          case 'present':
            totalPresent++;
            break;
          case 'absent':
            totalAbsent++;
            break;
          case 'late':
            totalLate++;
            break;
          case 'excused':
            totalExcused++;
            break;
        }
      }
    });

    const overallAttendancePercentage = totalDays > 0 
      ? Math.round(((totalPresent + totalLate) / totalDays) * 100)
      : 0;

    // Calculate exam performance
    let totalExams = 0;
    let totalMarks = 0;
    let passCount = 0;
    const examResults = [];

    exams.forEach(exam => {
      const result = exam.results.find(r => r.studentId.toString() === studentId);
      if (result) {
        totalExams++;
        totalMarks += result.marksObtained;
        if (result.percentage >= exam.passingMarks) {
          passCount++;
        }

        examResults.push({
          examName: exam.name,
          examType: exam.examType,
          examDate: exam.examDate,
          totalMarks: exam.totalMarks,
          marksObtained: result.marksObtained,
          percentage: result.percentage,
          grade: result.grade,
          passingMarks: exam.passingMarks,
          passed: result.percentage >= exam.passingMarks
        });
      }
    });

    const averageExamScore = totalExams > 0 ? Math.round(totalMarks / totalExams) : 0;
    const examPassPercentage = totalExams > 0 ? Math.round((passCount / totalExams) * 100) : 0;

    // Calculate course-wise performance
    const coursePerformance = enrollments.map(enrollment => {
      const courseAttendance = attendanceRecords.filter(ar => 
        ar.batchId.toString() === enrollment.batchId._id.toString()
      );
      
      const courseExams = exams.filter(exam => 
        exam.batchId.toString() === enrollment.batchId._id.toString()
      );

      const courseAttendanceDays = courseAttendance.length;
      const coursePresentDays = courseAttendance.filter(ar => {
        const studentRecord = ar.students.find(s => s.studentId.toString() === studentId);
        return studentRecord && (studentRecord.status === 'present' || studentRecord.status === 'late');
      }).length;

      const courseAttendancePercentage = courseAttendanceDays > 0 
        ? Math.round((coursePresentDays / courseAttendanceDays) * 100)
        : 0;

      const courseExamResults = courseExams.map(exam => {
        const result = exam.results.find(r => r.studentId.toString() === studentId);
        return result ? {
          examName: exam.name,
          marksObtained: result.marksObtained,
          percentage: result.percentage,
          grade: result.grade
        } : null;
      }).filter(Boolean);

      const courseAverageScore = courseExamResults.length > 0 
        ? Math.round(courseExamResults.reduce((sum, r) => sum + r.percentage, 0) / courseExamResults.length)
        : 0;

      return {
        courseId: enrollment.courseId._id,
        courseName: enrollment.courseId.name,
        batchName: enrollment.batchId.name,
        enrollmentDate: enrollment.enrollmentDate,
        status: enrollment.status,
        attendance: {
          totalDays: courseAttendanceDays,
          presentDays: coursePresentDays,
          percentage: `${courseAttendancePercentage}%`
        },
        exams: {
          totalExams: courseExams.length,
          results: courseExamResults,
          averageScore: courseAverageScore
        },
        grade: enrollment.grade,
        completionDate: enrollment.completionDate
      };
    });

    const report = {
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        studentId: student.studentId,
        role: student.role
      },
      overall: {
        totalCourses: enrollments.length,
        activeCourses: enrollments.filter(e => e.status === 'active').length,
        completedCourses: enrollments.filter(e => e.status === 'completed').length,
        overallAttendance: `${overallAttendancePercentage}%`,
        overallExamScore: `${averageExamScore}%`,
        examPassRate: `${examPassPercentage}%`
      },
      attendance: {
        totalDays,
        present: totalPresent,
        absent: totalAbsent,
        late: totalLate,
        excused: totalExcused,
        percentage: `${overallAttendancePercentage}%`
      },
      exams: {
        totalExams,
        averageScore: averageExamScore,
        passPercentage: examPassPercentage,
        passCount,
        failCount: totalExams - passCount,
        results: examResults
      },
      courses: coursePerformance,
      summary: {
        overallPerformance: Math.round((overallAttendancePercentage + averageExamScore) / 2),
        recommendation: getStudentRecommendation(overallAttendancePercentage, averageExamScore, totalExams)
      }
    };

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Student performance report generated successfully",
      data: report,
    });
  } catch (error) {
    console.error("Get student performance report error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Send Student Report to Email
const sendStudentReportEmail = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { email } = req.body;

    // Check if user has permission to send this report
    if (req.user.role === 'student' && req.user.id !== studentId) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "You can only send your own performance report",
      });
    }

    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Student not found",
      });
    }

    // Generate the performance report
    const report = await generateStudentReportForEmail(studentId);

    // Send email with report
    const emailSent = await sendStudentReportEmail(
      email || student.email,
      student.name,
      report
    );

    if (emailSent) {
      res.status(StatusCodes.OK).json({
        success: true,
        message: "Performance report sent to email successfully",
        data: {
          studentId,
          email: email || student.email,
          reportGenerated: true
        }
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to send email",
      });
    }
  } catch (error) {
    console.error("Send student report email error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Helper function to generate student report for email
const generateStudentReportForEmail = async (studentId) => {
  // This would contain the logic to generate a formatted report
  // For now, we'll return a basic structure
  return {
    studentId,
    generatedAt: new Date(),
    reportType: 'performance_summary'
  };
};

// Helper function to get performance recommendation
const getPerformanceRecommendation = (attendancePercentage, examPercentage) => {
  const overall = (attendancePercentage + examPercentage) / 2;
  
  if (overall >= 90) return "Excellent performance! Keep up the great work.";
  if (overall >= 80) return "Good performance. Consider improving in weaker areas.";
  if (overall >= 70) return "Satisfactory performance. Focus on attendance and exam preparation.";
  if (overall >= 60) return "Below average performance. Need improvement in multiple areas.";
  return "Poor performance. Immediate attention required from teachers and parents.";
};

// Helper function to get student recommendation
const getStudentRecommendation = (attendancePercentage, examPercentage, totalExams) => {
  if (totalExams === 0) {
    return "No exams taken yet. Focus on regular attendance and course completion.";
  }

  const overall = (attendancePercentage + examPercentage) / 2;
  
  if (overall >= 90) return "Outstanding student! Consider advanced courses or mentoring opportunities.";
  if (overall >= 80) return "Strong performance. Continue current study habits and consider leadership roles.";
  if (overall >= 70) return "Good progress. Focus on consistent attendance and exam preparation strategies.";
  if (overall >= 60) return "Needs improvement. Consider additional tutoring and study groups.";
  return "Requires immediate support. Schedule meeting with teachers and parents.";
};

module.exports = {
  getCoursesWithEnrollments,
  getBatchPerformanceReport,
  getStudentPerformanceReport,
  sendStudentReportEmail,
};