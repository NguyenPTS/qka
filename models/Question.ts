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
    required: false,
    default: "",
  },
  status: {
    type: String,
    enum: ['pending', 'answered', 'done'],
    default: 'pending',
  },
  images: [{
    type: String,
  }],
  source: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  collection: 'faq'
});

export default mongoose.models.Question || mongoose.model('Question', QuestionSchema); 