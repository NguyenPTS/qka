import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },
  keyword: [{
    type: String,
    required: true,
  }],
  answer: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  collection: 'questionkeywordanswer'
});

export default mongoose.models.Question || mongoose.model('Question', QuestionSchema); 