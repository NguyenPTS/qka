import mongoose, { Schema } from "mongoose";

const DiseaseSchema = new Schema({
  name: { type: String },
  phone: { type: String },
  age: { type: String },
  address: { type: String },
  disease: [{ type: String }],
  note: { type: String },
  page: {
    id: { type: String },
    name: { type: String },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.Disease || mongoose.model("Disease", DiseaseSchema, "disease");