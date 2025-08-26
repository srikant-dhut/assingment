const { Course, courseSchemaValidation } = require("../../moduals/CourseModel");
const { User } = require("../../moduals/UserModel");
const { StatusCodes } = require("../../helper/httpsStatusCode");

// Add Course (Admin Only)
const addCourse = async (req, res) => {
  try {
    const { error, value } = courseSchemaValidation.validate(req.body);
    if (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Validation error",
        error: error.details[0].message,
      });
    }

    const courseData = {
      ...value,
      createdBy: req.user.id,
    };

    const course = new Course(courseData);
    await course.save();

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Course created successfully",
      data: course,
    });
  } catch (error) {
    console.error("Add course error:", error);
    
    if (error.code === 11000) {
      return res.status(StatusCodes.CONFLICT).json({
        success: false,
        message: "Course with this name already exists",
      });
    }

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Edit Course Details (Admin Only)
const editCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated
    delete updateData.createdBy;
    delete updateData.totalBatches;
    delete updateData.totalEnrollments;

    const course = await Course.findByIdAndUpdate(
      courseId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!course) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Course not found",
      });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Course updated successfully",
      data: course,
    });
  } catch (error) {
    console.error("Edit course error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Delete Course (Admin Only)
const deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Course not found",
      });
    }

    // Check if course has active batches or enrollments
    // This would require additional checks against Batch and Enrollment models
    // For now, we'll just delete the course

    await Course.findByIdAndDelete(courseId);

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (error) {
    console.error("Delete course error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// List of Courses
const listCourses = async (req, res) => {
  try {
    const { 
      category, 
      isActive, 
      page = 1, 
      limit = 10, 
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (page - 1) * limit;

    // Build query
    let query = {};
    
    if (category) {
      query.category = category;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const courses = await Course.find(query)
      .populate('createdBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const totalCourses = await Course.countDocuments(query);

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Courses retrieved successfully",
      data: {
        courses,
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
    console.error("List courses error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get Course by ID
const getCourseById = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId)
      .populate('createdBy', 'name email')
      .populate({
        path: 'batches',
        select: 'name startDate endDate assignedTeacher currentStudents status',
        populate: {
          path: 'assignedTeacher',
          select: 'name email'
        }
      });

    if (!course) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Course not found",
      });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Course retrieved successfully",
      data: course,
    });
  } catch (error) {
    console.error("Get course error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get Course Statistics
const getCourseStats = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Course not found",
      });
    }

    // Get course statistics
    const stats = {
      totalBatches: course.totalBatches,
      totalEnrollments: course.totalEnrollments,
      activeBatches: 0, // This would require querying Batch model
      completedBatches: 0, // This would require querying Batch model
      averageAttendance: 0, // This would require querying Attendance model
      averageExamScore: 0, // This would require querying Exam model
    };

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Course statistics retrieved successfully",
      data: stats,
    });
  } catch (error) {
    console.error("Get course stats error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get Course Categories
const getCourseCategories = async (req, res) => {
  try {
    const categories = await Course.distinct('category');

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Course categories retrieved successfully",
      data: categories,
    });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  addCourse,
  editCourse,
  deleteCourse,
  listCourses,
  getCourseById,
  getCourseStats,
  getCourseCategories,
};
