const { Attendance, attendanceSchemaValidation } = require("../../moduals/AttendanceModel");
const { Batch } = require("../../moduals/BatchModel");
const { User } = require("../../moduals/UserModel");
const { StatusCodes } = require("../../helper/httpsStatusCode");

// Mark Attendance (Teacher)
const markAttendance = async (req, res) => {
  try {
    const { error, value } = attendanceSchemaValidation.validate(req.body);
    if (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Validation error",
        error: error.details[0].message,
      });
    }

    const { batchId, date, students } = value;

    // Check if attendance already exists for this batch and date
    const existingAttendance = await Attendance.findOne({ batchId, date });
    if (existingAttendance) {
      return res.status(StatusCodes.CONFLICT).json({
        success: false,
        message: "Attendance already marked for this date",
      });
    }

    // Verify batch exists and teacher is assigned
    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Batch not found",
      });
    }

    // Check if user is the assigned teacher for this batch
    if (batch.assignedTeacher.toString() !== req.user.id) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "You can only mark attendance for batches assigned to you",
      });
    }

    // Calculate attendance statistics
    let presentCount = 0, absentCount = 0, lateCount = 0, excusedCount = 0;
    
    students.forEach(student => {
      switch (student.status) {
        case 'present':
          presentCount++;
          break;
        case 'absent':
          absentCount++;
          break;
        case 'late':
          lateCount++;
          break;
        case 'excused':
          excusedCount++;
          break;
      }
    });

    const totalStudents = students.length;
    const attendancePercentage = Math.round((presentCount / totalStudents) * 100);

    const attendanceData = {
      ...value,
      markedBy: req.user.id,
      totalStudents,
      presentCount,
      absentCount,
      lateCount,
      excusedCount,
      attendancePercentage
    };

    const attendance = new Attendance(attendanceData);
    await attendance.save();

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Attendance marked successfully",
      data: {
        attendance,
        summary: {
          totalStudents,
          presentCount,
          absentCount,
          lateCount,
          excusedCount,
          attendancePercentage: `${attendancePercentage}%`
        }
      }
    });
  } catch (error) {
    console.error("Mark attendance error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// View Attendance (Student/Teacher)
const viewAttendance = async (req, res) => {
  try {
    const { batchId, studentId, startDate, endDate, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let query = {};

    if (batchId) {
      query.batchId = batchId;
    }

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // If student is viewing their own attendance
    if (req.user.role === 'student') {
      query['students.studentId'] = req.user.id;
    }

    // If teacher is viewing attendance for their batch
    if (req.user.role === 'teacher') {
      const batch = await Batch.findById(batchId);
      if (batch && batch.assignedTeacher.toString() !== req.user.id) {
        return res.status(StatusCodes.FORBIDDEN).json({
          success: false,
          message: "You can only view attendance for batches assigned to you",
        });
      }
    }

    const attendance = await Attendance.find(query)
      .populate('batchId', 'name')
      .populate('markedBy', 'name email')
      .populate('students.studentId', 'name email studentId')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalAttendance = await Attendance.countDocuments(query);

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Attendance retrieved successfully",
      data: {
        attendance,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalAttendance / limit),
          totalAttendance,
          hasNextPage: page * limit < totalAttendance,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error("View attendance error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Update Attendance (Teacher)
const updateAttendance = async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const { students } = req.body;

    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Attendance record not found",
      });
    }

    // Check if user is the one who marked the attendance or is admin
    if (attendance.markedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "You can only update attendance marked by you",
      });
    }

    // Check if attendance is locked
    if (attendance.isLocked) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Attendance record is locked and cannot be updated",
      });
    }

    // Recalculate attendance statistics
    let presentCount = 0, absentCount = 0, lateCount = 0, excusedCount = 0;
    
    students.forEach(student => {
      switch (student.status) {
        case 'present':
          presentCount++;
          break;
        case 'absent':
          absentCount++;
          break;
        case 'late':
          lateCount++;
          break;
        case 'excused':
          excusedCount++;
          break;
      }
    });

    const totalStudents = students.length;
    const attendancePercentage = Math.round((presentCount / totalStudents) * 100);

    const updatedAttendance = await Attendance.findByIdAndUpdate(
      attendanceId,
      {
        students,
        totalStudents,
        presentCount,
        absentCount,
        lateCount,
        excusedCount,
        attendancePercentage
      },
      { new: true }
    ).populate('students.studentId', 'name email studentId');

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Attendance updated successfully",
      data: updatedAttendance,
    });
  } catch (error) {
    console.error("Update attendance error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get Attendance Summary
const getAttendanceSummary = async (req, res) => {
  try {
    const { batchId, studentId, startDate, endDate } = req.query;

    let query = {};

    if (batchId) {
      query.batchId = batchId;
    }

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // If student is viewing their own summary
    if (req.user.role === 'student') {
      query['students.studentId'] = req.user.id;
    }

    const attendanceRecords = await Attendance.find(query);

    let totalDays = 0;
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalLate = 0;
    let totalExcused = 0;

    attendanceRecords.forEach(record => {
      totalDays++;
      
      if (studentId) {
        // Individual student summary
        const studentRecord = record.students.find(s => s.studentId.toString() === studentId);
        if (studentRecord) {
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
      } else {
        // Batch summary
        totalPresent += record.presentCount;
        totalAbsent += record.absentCount;
        totalLate += record.lateCount;
        totalExcused += record.excusedCount;
      }
    });

    const overallAttendance = totalDays > 0 ? Math.round(((totalPresent + totalLate) / totalDays) * 100) : 0;

    const summary = {
      totalDays,
      totalPresent,
      totalAbsent,
      totalLate,
      totalExcused,
      overallAttendance: `${overallAttendance}%`,
      breakdown: {
        present: totalPresent,
        absent: totalAbsent,
        late: totalLate,
        excused: totalExcused
      }
    };

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Attendance summary retrieved successfully",
      data: summary,
    });
  } catch (error) {
    console.error("Get attendance summary error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Lock/Unlock Attendance
const toggleAttendanceLock = async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const { isLocked } = req.body;

    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Attendance record not found",
      });
    }

    // Only admin or the teacher who marked attendance can lock/unlock
    if (attendance.markedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "You don't have permission to modify this attendance record",
      });
    }

    attendance.isLocked = isLocked;
    await attendance.save();

    res.status(StatusCodes.OK).json({
      success: true,
      message: `Attendance ${isLocked ? 'locked' : 'unlocked'} successfully`,
      data: {
        attendanceId,
        isLocked: attendance.isLocked
      }
    });
  } catch (error) {
    console.error("Toggle attendance lock error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  markAttendance,
  viewAttendance,
  updateAttendance,
  getAttendanceSummary,
  toggleAttendanceLock,
};
