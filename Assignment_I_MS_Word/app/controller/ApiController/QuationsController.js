const Question = require("../../moduals/QuestionsModel");
const mongoose = require("mongoose");

class QuationsControllers {
 async listByCategory(req, res) {
  try {
    const categoryId = req.params.id;
    const questions = await Question.aggregate([
      { $match: { categories: { $in: [new mongoose.Types.ObjectId(categoryId)] } } }
    ]);
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

  async submitAnswer(req, res) {
    try {
      const { questionId, answer } = req.body;
      const question = await Question.findById(questionId);
      
      if (!question) {
        return res.status(404).json({ error: "Question not found" });
      }

      // Get user's timezone from request headers or default to UTC
      const timezone = req.headers['timezone'] || 'UTC';
      
      question.answers.push({
        userId: req.user.userId,
        answer,
        submittedAt: new Date(),
        timezone: timezone
      });
      await question.save();
      res.json({ msg: "Answer submitted successfully" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async addQuestion(req, res) {
  try {
    const { text, options, correctAnswer, categories } = req.body;
    
    // Validation
    if (!text || !options || !correctAnswer || !categories) {
      return res.status(400).json({ 
        error: "Text, options, correct answer, and categories are required" 
      });
    }
    
    if (!Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ 
        error: "At least 2 options are required for MCQ" 
      });
    }
    
    if (!options.includes(correctAnswer)) {
      return res.status(400).json({ 
        error: "Correct answer must be one of the provided options" 
      });
    }

    const question = new Question({
      text,
      options,
      correctAnswer,
      categories,
      answers: []
    });
    await question.save();
    res.status(201).json(question);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

  async searchQuestionWithAnswers(req, res) {
    try {
      const searchText = req.query.q;
      if (!searchText) {
        return res.status(400).json({ error: "Search query is required" });
      }
      
      const data = await Question.aggregate([
        { $match: { text: { $regex: searchText, $options: "i" } } },
        { $unwind: "$answers" },
        {
          $lookup: {
            from: "users",
            localField: "answers.userId",
            foreignField: "_id",
            as: "userDetails"
          }
        },
        { $unwind: "$userDetails" },
        {
          $project: {
            question: "$text",
            answer: "$answers.answer",
            submittedAt: "$answers.submittedAt",
            timezone: "$answers.timezone",
            user: "$userDetails.name"
          }
        }
      ]);
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new QuationsControllers();
