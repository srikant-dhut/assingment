const { Batch, batchSchemaValidation } = require("../../moduals/BatchModel");
const { Course } = require("../../moduals/CourseModel");
const { User } = require("../../moduals/UserModel");
const { StatusCodes } = require("../../helper/httpsStatusCode");

// Add Batch (Admin/Teacher)
const addBatch = async (req, res) => {
  try {
    const { error, value } = batchSchemaValidation.validate(req.body);
    if (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Validation error",
        error: error.details[0].message,
      });
    }

    const { courseId, assignedTeacher } = value;

    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Course not found",
      });
    }

    // Verify teacher exists and has teacher role
    const teacher = await User.findById(assignedTeacher);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Invalid teacher ID or user is not a teacher",
      });
    }

    const batchData = {
      ...value,
      createdBy: req.user.id,
    };

    const batch = new Batch(batchData);
    await batch.save();

    // Update course total batches count
    await Course.findByIdAndUpdate(courseId, {
      $inc: { totalBatches: 1 }
    });

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Batch created successfully",
      data: batch,
    });
  } catch (error) {
    console.error("Add batch error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Assign Students to Batch (Admin Only)
const assignStudentsToBatch = async (req, res) => {
  try {
    const { batchId } = req.params;
    const { studentIds } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Student IDs array is required",
      });
    }

    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Batch not found",
      });
    }

    // Check if batch has capacity
    if (batch.currentStudents + studentIds.length > batch.maxStudents) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Batch capacity exceeded",
      });
    }

    // Verify all students exist and have student role
    const students = await User.find({
      _id: { $in: studentIds },
      role: 'student'
    });

    if (students.length !== studentIds.length) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Some students not found or invalid",
      });
    }

    // Update batch current students count
    await Batch.findByIdAndUpdate(batchId, {
      $inc: { currentStudents: studentIds.length }
    });

    // Here you would also create enrollment records
    // This would require the Enrollment model

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Students assigned to batch successfully",
      data: {
        batchId,
        assignedStudents: students.length,
        currentStudents: batch.currentStudents + students.length
      }
    });
  } catch (error) {
    console.error("Assign students error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// List of Batches
const listBatches = async (req, res) => {
  try {
    const { 
      courseId, 
      assignedTeacher, 
      status, 
      isActive, 
      page = 1, 
      limit = 10,
      search,
      sortBy = 'startDate',
      sortOrder = 'desc'
    } = req.query;

    const skip = (page - 1) * limit;

    // Build query
    let query = {};
    
    if (courseId) {
      query.courseId = courseId;
    }

    if (assignedTeacher) {
      query.assignedTeacher = assignedTeacher;
    }

    if (status) {
      query.status = status;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const batches = await Batch.find(query)
      .populate('courseId', 'name description')
      .populate('assignedTeacher', 'name email')
      .populate('createdBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const totalBatches = await Batch.countDocuments(query);

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Batches retrieved successfully",
      data: {
        batches,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalBatches / limit),
          totalBatches,
          hasNextPage: page * limit < totalBatches,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error("List batches error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Update Batch Details (Admin/Teacher)
const updateBatch = async (req, res) => {
  try {
    const { batchId } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated
    delete updateData.createdBy;
    delete updateData.currentStudents;

    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Batch not found",
      });
    }

    // Check if user has permission to update this batch
    if (req.user.role === 'teacher' && batch.assignedTeacher.toString() !== req.user.id) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "You can only update batches assigned to you",
      });
    }

    const updatedBatch = await Batch.findByIdAndUpdate(
      batchId,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Batch updated successfully",
      data: updatedBatch,
    });
  } catch (error) {
    console.error("Update batch error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Delete Batch (Admin Only)
const deleteBatch = async (req, res) => {
  try {
    const { batchId } = req.params;

    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Batch not found",
      });
    }

    // Check if batch has enrolled students
    if (batch.currentStudents > 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Cannot delete batch with enrolled students",
      });
    }

    await Batch.findByIdAndDelete(batchId);

    // Update course total batches count
    await Course.findByIdAndUpdate(batch.courseId, {
      $inc: { totalBatches: -1 }
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Batch deleted successfully",
    });
  } catch (error) {
    console.error("Delete batch error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get Batch by ID
const getBatchById = async (req, res) => {
  try {
    const { batchId } = req.params;

    const batch = await Batch.findById(batchId)
      .populate('courseId', 'name description duration fees')
      .populate('assignedTeacher', 'name email phone')
      .populate('createdBy', 'name email');

    if (!batch) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Batch not found",
      });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Batch retrieved successfully",
      data: batch,
    });
  } catch (error) {
    console.error("Get batch error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get Batch Statistics
const getBatchStats = async (req, res) => {
  try {
    const { batchId } = req.params;

    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Batch not found",
      });
    }

    // Get batch statistics
    const stats = {
      totalStudents: batch.currentStudents,
      maxStudents: batch.maxStudents,
      capacityPercentage: Math.round((batch.currentStudents / batch.maxStudents) * 100),
      status: batch.status,
      duration: {
        startDate: batch.startDate,
        endDate: batch.endDate,
        totalDays: Math.ceil((batch.endDate - batch.startDate) / (1000 * 60 * 60 * 24))
      }
    };

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Batch statistics retrieved successfully",
      data: stats,
    });
  } catch (error) {
    console.error("Get batch stats error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  addBatch,
  assignStudentsToBatch,
  listBatches,
  updateBatch,
  deleteBatch,
  getBatchById,
  getBatchStats,
};
