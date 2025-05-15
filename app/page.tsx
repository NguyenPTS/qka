"use client";

import { useState, useEffect, useCallback } from "react";
import React from "react";
import {
  CardHeader,
  CardTitle,
  CardDescription,
  Tabs as ShadcnTabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Label,
  Textarea,
  Button,
  Input
} from "../components/ui";
import {
  ImageIcon,
  PlusCircle,
  Trash2,
  Edit,
  RefreshCw,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  ArrowUp,
  ExternalLink,
  Edit3,
  X,
  ArrowUpDown,
  ArrowDown
} from "lucide-react";
import Image from 'next/image';
import type { StaticImageData } from 'next/image';

interface Question {
  _id?: string;
  question: string;
  keyword: string | string[];
  answer: string;
  images?: Array<string | { id: string; url: string }>;
  createdAt?: string;
  __v?: number;
}

interface CrudTableProps {
  crudQuestions: Question[];
  handleCrudEdit: (q: Question) => void;
  handleCrudDelete: (id: string) => void;
}

interface SaleQuestion {
  id: string;
  text: string;
  images: Array<{ id: string; url: string; }>;
  status: 'pending' | 'done';
  createdAt: Date;
  answer?: string;
}

const uploadToWordPress = async (file: File) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    // Gửi file qua API của chúng ta
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Upload failed');
    }
    
    const data = await response.json();
    return data.url; // URL của ảnh từ API trả về
  } catch (error) {
    console.error('Error uploading to WordPress:', error);
    throw error;
  }
};

const CrudTable = React.memo(function CrudTable({ 
  crudQuestions, 
  handleCrudEdit, 
  handleCrudDelete,
  handleSortChange,
  getSortIcon
}: CrudTableProps & {
  handleSortChange: (field: string) => void;
  getSortIcon: (field: string) => React.ReactNode;
}) {
  // Hàm kiểm tra và xử lý URL ảnh
  const getImageUrl = (url: string | undefined): string | null => {
    if (!url) {
      console.log('URL is empty');
      return null;
    }
    
    console.log('Original image URL:', url);
    try {
      // Nếu là blob URL, bỏ qua không hiển thị
      if (url.startsWith('blob:')) {
        console.log('URL is blob:', url);
        return null;
      }

      // Nếu URL đã là URL đầy đủ, trả về nguyên bản
      if (url.match(/^https?:\/\//)) {
        console.log('Using original URL:', url);
        return url;
      }

      // Nếu URL bắt đầu bằng /wp-content, thêm domain
      if (url.startsWith('/wp-content')) {
        const fullUrl = `https://wordpress.pharmatech.vn${url}`;
        console.log('Converted to full URL:', fullUrl);
        return fullUrl;
      }

      // Nếu URL không có schema, thêm domain
      const baseUrl = 'https://wordpress.pharmatech.vn';
      const fullUrl = `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
      console.log('Converted to full URL:', fullUrl);
      return fullUrl;
    } catch (error) {
      console.error('Error processing image URL:', error);
      return null;
    }
  };

  // Log toàn bộ dữ liệu câu hỏi để debug
  console.log('Questions data:', crudQuestions);

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="min-w-full divide-y divide-gray-200">
        <div className="bg-gray-50">
          <div className="grid grid-cols-12 gap-4 px-6 py-3">
            <button 
              onClick={() => handleSortChange("question")}
              className="col-span-3 flex items-center gap-2 hover:text-blue-600 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Câu hỏi {getSortIcon("question")}
            </button>
            <button 
              onClick={() => handleSortChange("keyword")}
              className="col-span-2 flex items-center gap-2 hover:text-blue-600 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Từ khóa {getSortIcon("keyword")}
            </button>
            <button 
              onClick={() => handleSortChange("answer")}
              className="col-span-5 flex items-center gap-2 hover:text-blue-600 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Câu trả lời {getSortIcon("answer")}
            </button>
            <div className="col-span-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Thao tác
            </div>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {crudQuestions.map((q) => {
            console.log('Processing question:', q._id);
            console.log('Images for question:', q.images);
            
            return (
              <div key={q._id} className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50">
                <div className="col-span-3">
                  <p className="text-sm text-gray-900">{q.question}</p>
                </div>
                <div className="col-span-2">
                  <div className="flex flex-wrap gap-1">
                    {Array.isArray(q.keyword) ? q.keyword.map((k, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {k}
                      </span>
                    )) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {q.keyword}
                      </span>
                    )}
                  </div>
                </div>
                <div className="col-span-5">
                  <div className="space-y-2">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{q.answer}</p>
                    {q.images && q.images.length > 0 && (
                      <div className="mt-2">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Hình ảnh đính kèm:</h3>
                        <div className="grid grid-cols-3 gap-4">
                          {q.images.map((image, index) => {
                            const imageUrl = typeof image === 'string' ? image : image.url;
                            const fullImageUrl = getImageUrl(imageUrl);
                            if (!fullImageUrl) return null;
                            
                            return (
                              <div key={index} className="relative group rounded-lg overflow-hidden shadow-sm">
                                <Image
                                  src={fullImageUrl}
                                  alt={`Answer image ${index + 1}`}
                                  width={300}
                                  height={200}
                                  className="w-full h-32 object-cover rounded-lg border border-gray-200"
                                  onError={(e) => {
                                    console.error(`Error loading image ${index + 1}:`, fullImageUrl);
                                    const target = e.target as HTMLImageElement;
                                    target.onerror = null;
                                    target.style.display = 'none';
                                  }}
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity">
                                  <a
                                    href={fullImageUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100"
                                  >
                                    <span className="p-2 bg-white rounded-full">
                                      <ExternalLink size={16} className="text-gray-900" />
                                    </span>
                                  </a>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {q.createdAt && (
                      <p className="text-xs text-gray-500">
                        Ngày tạo: {new Date(q.createdAt).toLocaleDateString('vi-VN')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="col-span-2 flex justify-end gap-2">
                  <button
                    onClick={() => handleCrudEdit(q)}
                    className="inline-flex items-center p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Sửa"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => handleCrudDelete(q._id)}
                    className="inline-flex items-center p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Xóa"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {crudQuestions.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Không có câu hỏi nào
        </div>
      )}
    </div>
  );
});

const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  return (
    <button
      onClick={scrollToTop}
      className={`fixed right-6 bottom-6 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"
      }`}
      aria-label="Lên đầu trang"
    >
      <ArrowUp className="h-6 w-6" />
    </button>
  );
};

export default function Home() {
  // States
  const [tab, setTab] = useState('0');
  const [prevTab, setPrevTab] = useState('0');
  const [question, setQuestion] = useState("");
  const [keyword, setKeyword] = useState<string[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [hasSearched, setHasSearched] = useState(false);
  
  // Add management states
  const [crudQuestions, setCrudQuestions] = useState<Question[]>([]);
  const [crudTotal, setCrudTotal] = useState(0);
  const [crudPage, setCrudPage] = useState(1);
  const crudPageSize = 10;
  const [form, setForm] = useState({ question: "", keyword: "", answer: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string>("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [pendingSortBy, setPendingSortBy] = useState<'createdAt' | 'updatedAt'>('createdAt');
  const [pendingSortOrder, setPendingSortOrder] = useState<'asc' | 'desc'>(sortOrder);
  const [isLocked, setIsLocked] = useState(true);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [subTab, setSubTab] = useState('pending');
  const [newQuestionImages, setNewQuestionImages] = useState<File[]>([]);
  const [searchQuestion, setSearchQuestion] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Add sale states
  const [saleNewQuestion, setSaleNewQuestion] = useState("");
  const [saleSelectedImages, setSaleSelectedImages] = useState<File[]>([]);
  const [saleImagePreviewUrls, setSaleImagePreviewUrls] = useState<string[]>([]);
  const [saleQuestions, setSaleQuestions] = useState<SaleQuestion[]>([]);
  const [saleAnswers, setSaleAnswers] = useState<Record<string, string>>({});
  const [saleCurrentTab, setSaleCurrentTab] = useState<'pending' | 'done'>("pending");
  const [questionImages, setQuestionImages] = useState<Record<string, File[]>>({});

  const [editImages, setEditImages] = useState<File[]>([]);
  const [editImagePreviews, setEditImagePreviews] = useState<string[]>([]);

  const handleQuestionSubmit = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setError("");
    setHasSearched(true);
    setSelectedKeywords([]);
    setQuestions([]);
    try {
      const response = await fetch(
        `/api/questions/keyword?question=${encodeURIComponent(question)}`
      );
      const data = await response.json();
      if (response.ok) {
        setKeyword(data);
      } else {
        setError(data.error || "Failed to fetch keywords");
      }
    } catch (error) {
      setError("Failed to connect to the server");
    } finally {
      setLoading(false);
    }
  };

  const handleKeywordToggle = async (keyword: string) => {
    setLoading(true);
    setError("");
    try {
      const newSelectedKeywords = selectedKeywords.includes(keyword)
        ? selectedKeywords.filter((k) => k !== keyword)
        : [...selectedKeywords, keyword];
      setSelectedKeywords(newSelectedKeywords);
      if (newSelectedKeywords.length === 0) {
        setQuestions([]);
        setLoading(false);
        return;
      }
      const keywordsParam = newSelectedKeywords
        .map((k) => encodeURIComponent(k))
        .join(",");
      const response = await fetch(
        `/api/questions/search?keywords=${keywordsParam}`
      );
      const data = await response.json();
      if (response.ok) {
        setQuestions(data);
      } else {
        setError(data.error || "Failed to fetch questions");
      }
    } catch (error) {
      setError("Failed to connect to the server");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuestion("");
    setKeyword([]);
    setSelectedKeywords([]);
    setQuestions([]);
    setError("");
    setHasSearched(false);
  };

  // Add management functions
  const fetchCrudQuestions = useCallback(async (page = 1, sortByParam = sortBy, sortOrderParam = sortOrder) => {
    let retries = 3;
    while (retries > 0) {
      try {
        const response = await fetch(
          `/api/questions?page=${page}&limit=10&sortBy=${sortByParam}&sortOrder=${sortOrderParam}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch questions');
        }
        
        const data = await response.json();
        console.log('API Response:', data);

        if (!data.success || !data.data || !Array.isArray(data.data.questions)) {
          console.error('Invalid response format:', data);
          throw new Error('Invalid response format');
        }
        
        // Kiểm tra và cập nhật state chỉ khi có dữ liệu hợp lệ
        if (data.data.total !== undefined && typeof data.data.total === 'number') {
          setCrudTotal(data.data.total);
          // Đảm bảo trang hiện tại không vượt quá tổng số trang
          const maxPage = Math.ceil(data.data.total / 10);
          const validPage = Math.min(page, maxPage);
          if (validPage !== page) {
            // Nếu trang hiện tại không hợp lệ, tự động chuyển về trang cuối
            setCrudPage(validPage);
            if (validPage < page) {
              // Nếu đang ở trang lớn hơn trang cuối, fetch lại dữ liệu
              fetchCrudQuestions(validPage, sortByParam, sortOrderParam);
              return;
            }
          } else {
            setCrudPage(page);
          }
        }
        
        setCrudQuestions(data.data.questions);
        return;
      } catch (error) {
        console.error('Error fetching questions:', error);
        retries--;
        if (retries === 0) {
          setErrorMsg("Có lỗi khi tải danh sách câu hỏi! Vui lòng thử lại sau.");
          // Reset states khi có lỗi
          setCrudQuestions([]);
          setCrudTotal(0);
        } else {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
  }, [sortBy, sortOrder]);

  useEffect(() => {
    if (tab === "1" && !isLocked) {
      fetchCrudQuestions(1, sortBy, sortOrder);
    }
  }, [tab, isLocked, sortBy, sortOrder, fetchCrudQuestions]);

  const handleSortChange = useCallback((field: string) => {
    if (sortBy === field) {
      // If clicking the same field, toggle order
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // If clicking a new field, set it as sortBy and default to desc
      setSortBy(field);
      setSortOrder("desc");
    }
  }, [sortBy, sortOrder]);

  const getSortIcon = useCallback((field: string) => {
    if (sortBy !== field) return <ArrowUpDown size={16} className="text-gray-400" />;
    return sortOrder === "asc" ? 
      <ArrowUp size={16} className="text-blue-600" /> : 
      <ArrowDown size={16} className="text-blue-600" />;
  }, [sortBy, sortOrder]);

  const handleCrudChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => 
    setForm(f => ({ ...f, [e.target.name]: e.target.value })), []);

  const handleCrudTextAreaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => 
    setForm(f => ({ ...f, [e.target.name]: e.target.value })), []);

  const handleNewQuestionImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setNewQuestionImages((prev) => [...prev, ...files]);
  };

  const removeNewQuestionImage = (index: number) => {
    setNewQuestionImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCrudSubmit = async () => {
    try {
      // Validate form
      if (!form.question.trim()) {
        setErrorMsg("Vui lòng nhập câu hỏi!");
        return;
      }
      if (!form.keyword.trim()) {
        setErrorMsg("Vui lòng nhập từ khóa!");
        return;
      }
      if (!form.answer.trim()) {
        setErrorMsg("Vui lòng nhập câu trả lời!");
        return;
      }

      setIsSubmitting(true);
      setSubmitError(null);
      setErrorMsg("");

      // Handle images
      let imageUrls: string[] = [];
      
      if (editingId) {
        // For editing: use existing images that haven't been removed
        imageUrls = editImagePreviews.filter(url => !url.startsWith('blob:'));
        
        // Upload new images from editImages
        if (editImages.length > 0) {
          for (const file of editImages) {
            try {
              const formData = new FormData();
              formData.append('file', file);
              
              const uploadResponse = await fetch('/api/upload', {
                method: 'POST',
                body: formData
              });

              if (!uploadResponse.ok) {
                const errorData = await uploadResponse.json();
                throw new Error(`Lỗi upload ảnh ${file.name}: ${errorData.message || 'Upload failed'}`);
              }

              const data = await uploadResponse.json();
              if (data.url) {
                imageUrls.push(data.url);
              } else {
                throw new Error(`Không nhận được URL ảnh từ server cho file ${file.name}`);
              }
            } catch (error: any) {
              console.error(`Error uploading image ${file.name}:`, error);
              const continueUpload = window.confirm(`${error.message || `Lỗi khi upload ảnh ${file.name}`}. Tiếp tục với các ảnh khác?`);
              if (!continueUpload) {
                setIsSubmitting(false);
                return;
              }
            }
          }
        }
      } else {
        // For new questions: upload images from newQuestionImages
        if (newQuestionImages.length > 0) {
          for (const file of newQuestionImages) {
            try {
              const formData = new FormData();
              formData.append('file', file);
              
              const uploadResponse = await fetch('/api/upload', {
                method: 'POST',
                body: formData
              });

              if (!uploadResponse.ok) {
                const errorData = await uploadResponse.json();
                throw new Error(`Lỗi upload ảnh ${file.name}: ${errorData.message || 'Upload failed'}`);
              }

              const data = await uploadResponse.json();
              if (data.url) {
                imageUrls.push(data.url);
              } else {
                throw new Error(`Không nhận được URL ảnh từ server cho file ${file.name}`);
              }
            } catch (error: any) {
              console.error(`Error uploading image ${file.name}:`, error);
              const continueUpload = window.confirm(`${error.message || `Lỗi khi upload ảnh ${file.name}`}. Tiếp tục với các ảnh khác?`);
              if (!continueUpload) {
                setIsSubmitting(false);
                return;
              }
            }
          }
        }
      }

      if (editingId) {
        const response = await fetch(`/api/questions/${editingId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...form,
            keyword: form.keyword.split(",").map((k) => k.trim()).filter(k => k),
            images: imageUrls
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Không thể cập nhật câu hỏi');
        }
        
        await fetchCrudQuestions(crudPage, sortBy, sortOrder);
        setEditingId(null);
        setEditOpen(false);
        setForm({ question: "", keyword: "", answer: "" });
        setEditImages([]);
        setEditImagePreviews([]);
        setSuccessMsg("Cập nhật câu hỏi thành công!");
      } else {
        const questionData = {
          ...form,
          keyword: form.keyword.split(",").map((k) => k.trim()).filter(k => k),
          images: imageUrls,
          createdAt: new Date().toISOString()
        };

        const response = await fetch("/api/questions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(questionData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Không thể tạo câu hỏi mới');
        }

        await fetchCrudQuestions(crudPage, sortBy, sortOrder);
        setForm({ question: "", keyword: "", answer: "" });
        setNewQuestionImages([]);
        setSuccessMsg("Thêm câu hỏi thành công!");
      }
    } catch (error: any) {
      console.error("Error submitting question:", error);
      setSubmitError(error.message);
      setErrorMsg(error.message || "Có lỗi xảy ra khi xử lý yêu cầu!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setEditImages((prev) => [...prev, ...files]);
    const newPreviewUrls = files.map((file) => URL.createObjectURL(file));
    setEditImagePreviews((prev) => [...prev, ...newPreviewUrls]);
  };

  const removeEditImage = (index: number) => {
    const url = editImagePreviews[index];
    // If it's a blob URL, we need to revoke it
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
      // Also remove the corresponding File object
      setEditImages((prev) => prev.filter((_, i) => i !== editImages.length - (editImagePreviews.length - index)));
    }
    setEditImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCrudEdit = useCallback((q: Question) => {
    setForm({
      question: q.question,
      keyword: Array.isArray(q.keyword) ? q.keyword.join(", ") : q.keyword,
      answer: q.answer,
    });
    setEditingId(q._id);
    setEditOpen(true);
    // Convert complex image objects to string URLs
    if (q.images && q.images.length > 0) {
      const imageUrls = q.images.map(img => typeof img === 'string' ? img : img.url);
      setEditImagePreviews(imageUrls);
    }
  }, []);

  const handleEditClose = () => {
    setEditOpen(false);
    setEditingId(null);
    setForm({ question: "", keyword: "", answer: "" });
    setEditImages([]);
    setEditImagePreviews([]);
  };

  const handleCrudDelete = useCallback((id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa câu hỏi này?')) {
      fetch(`/api/questions/${id}`, { 
        method: "DELETE" 
      })
      .then(response => {
        if (!response.ok) throw new Error('Failed to delete');
        fetchCrudQuestions(crudPage, sortBy, sortOrder);
        setSuccessMsg("Xóa câu hỏi thành công!");
      })
      .catch(error => {
        console.error('Error deleting question:', error);
        setErrorMsg("Có lỗi xảy ra khi xóa câu hỏi!");
      });
    }
  }, [crudPage, sortBy, sortOrder, fetchCrudQuestions]);

  const handleTabChange = (_: any, value: string) => {
    setPrevTab(tab);
    setTab(value);
    if (value === "1" && isLocked) {
      setShowPasswordDialog(true);
    }
  };

  useEffect(() => {
    if (tab === "1" && isLocked && !showPasswordDialog) {
      setShowPasswordDialog(true);
    }
  }, [tab, isLocked, showPasswordDialog]);

  // Add sale functions
  const handleSaleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSaleSelectedImages((prev) => [...prev, ...files]);
    const newPreviewUrls = files.map((file) => URL.createObjectURL(file));
    setSaleImagePreviewUrls((prev) => [...prev, ...newPreviewUrls]);
  };

  const removeSaleImage = (index: number) => {
    setSaleSelectedImages((prev) => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(saleImagePreviewUrls[index]);
    setSaleImagePreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const addSaleQuestion = () => {
    if (!saleNewQuestion.trim()) return;
    const newQuestionImages = saleImagePreviewUrls.map((url, index) => ({ 
      id: `img-${Date.now()}-${index}`, 
      url 
    }));
    const newQuestionItem: SaleQuestion = {
      id: `q-${Date.now()}`,
      text: saleNewQuestion,
      images: newQuestionImages,
      status: "pending" as const,
      createdAt: new Date(),
    };
    setSaleQuestions((prev) => [newQuestionItem, ...prev]);
    setSaleNewQuestion("");
    setSaleSelectedImages([]);
    setSaleImagePreviewUrls([]);
  };

  const handleSaleAnswerChange = (questionId: string, value: string) => {
    setSaleAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>, questionId: string) => {
    const files = Array.from(e.target.files || []);
    setQuestionImages(prev => ({
      ...prev,
      [questionId]: [...(prev[questionId] || []), ...files]
    }));
  };

  const removeImage = (questionId: string, index: number) => {
    setQuestionImages(prev => ({
      ...prev,
      [questionId]: prev[questionId].filter((_, i) => i !== index)
    }));
  };

  const answerSaleQuestion = async (questionId: string) => {
    try {
      const answer = saleAnswers[questionId];
      if (!answer?.trim()) return;

      const imageUrls: Array<{ id: string; url: string }> = [];
      if (questionImages[questionId]) {
        const loadingMessage = `Đang upload ${questionImages[questionId].length} ảnh...`;
        alert(loadingMessage);

        for (const file of questionImages[questionId]) {
          try {
            const url = await uploadToWordPress(file);
            if (url) {
              imageUrls.push({
                id: `img-${Date.now()}-${imageUrls.length}`,
                url
              });
              alert(`Đã upload ${imageUrls.length}/${questionImages[questionId].length} ảnh`);
            }
          } catch (error) {
            console.error(`Error uploading image ${file.name}:`, error);
            alert(`Lỗi khi upload ảnh ${file.name}. Đang thử lại...`);
            try {
              const url = await uploadToWordPress(file);
              if (url) {
                imageUrls.push({
                  id: `img-${Date.now()}-${imageUrls.length}`,
                  url
                });
                alert(`Đã upload ${imageUrls.length}/${questionImages[questionId].length} ảnh`);
              }
            } catch (retryError) {
              console.error(`Retry failed for image ${file.name}:`, retryError);
              const continueUpload = window.confirm(`Không thể upload ảnh ${file.name}. Bạn có muốn tiếp tục với các ảnh khác không?`);
              if (!continueUpload) {
                return;
              }
            }
          }
        }
      }

      setSaleQuestions(prev => 
        prev.map(q => 
          q.id === questionId 
            ? { ...q, answer, images: imageUrls, status: 'done' as const } 
            : q
        )
      );

      setSaleAnswers(prev => {
        const newAnswers = { ...prev };
        delete newAnswers[questionId];
        return newAnswers;
      });
      setQuestionImages(prev => {
        const newImages = { ...prev };
        delete newImages[questionId];
        return newImages;
      });

      alert(`Đã lưu câu trả lời và upload ${imageUrls.length} ảnh thành công!`);

    } catch (error) {
      console.error('Error submitting answer:', error);
      alert(`Có lỗi xảy ra khi gửi câu trả lời: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const deleteSaleQuestion = (questionId: string) => {
    setSaleQuestions((prev) => prev.filter((q) => q.id !== questionId));
  };

  const resetSaleToPending = (questionId: string) => {
    setSaleQuestions((prev) => prev.map((q) => (q.id === questionId ? { ...q, status: "pending", answer: undefined } : q)));
  };

  const saleFilteredQuestions = saleQuestions.filter((q) => q.status === saleCurrentTab);

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-center w-full min-h-screen bg-gray-50">
        <div className="w-full max-w-5xl px-4 py-8 bg-white rounded-2xl shadow-lg">
          <h1 className="text-3xl font-bold mb-8">Quản lý câu hỏi</h1>
          
          <ShadcnTabs value={tab} onValueChange={setTab} className="mb-6">
            <TabsList>
              <TabsTrigger value="0">Tìm kiếm câu hỏi</TabsTrigger>
              <TabsTrigger value="1">Quản lý câu hỏi</TabsTrigger>
              {/* <TabsTrigger value="2">Thêm câu hỏi bởi sale</TabsTrigger> */}
            </TabsList>

            <TabsContent value="0">
              <h2 className="text-2xl font-bold mb-4">Tìm kiếm câu hỏi</h2>
              <div className="p-4 mb-4 bg-white rounded-lg">
                <input
                  type="text"
                  placeholder="Type your question and press Enter..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleQuestionSubmit()}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
                <div className="mt-2 flex gap-2">
                  <Button onClick={handleQuestionSubmit} disabled={loading}>
                    {loading ? "Searching..." : "Find Keywords"}
                  </Button>
                  <Button 
                    onClick={handleClear} 
                    disabled={loading || !hasSearched} 
                    className="border border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                  >
                    Clear
                  </Button>
                </div>
              </div>

              {error && (
                <div className="mb-2 text-red-500">{error}</div>
              )}

              {hasSearched && !loading && keyword.length === 0 && (
                <div className="mb-2 text-blue-500">
                  No keywords found for your question. Please try a different question.
                </div>
              )}

              {keyword.length > 0 && (
                <div className="p-4 mb-4 bg-white rounded-lg">
                  <h3 className="text-base font-bold mb-2">Related Keywords ({keyword.length}) - Selected: {selectedKeywords.length}</h3>
                  <div className="flex flex-wrap gap-2">
                    {keyword.map((kw) => (
                      <button
                        key={kw}
                        onClick={() => handleKeywordToggle(kw)}
                        className={`px-2 py-1 border ${selectedKeywords.includes(kw) ? 'border-blue-500' : 'border-gray-200'} rounded-md ${selectedKeywords.includes(kw) ? 'bg-blue-50' : ''}`}
                      >
                        {kw}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedKeywords.length > 0 && (
                <div className="p-4 mb-4 bg-white rounded-lg">
                  <h3 className="text-base font-bold mb-2">Selected Keywords:</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedKeywords.map((kw) => (
                      <button
                        key={kw}
                        onClick={() => handleKeywordToggle(kw)}
                        className="px-2 py-1 border border-gray-200 rounded-md"
                      >
                        {kw}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedKeywords.length > 0 && !loading && questions.length === 0 && (
                <div className="text-blue-500">
                  No questions found for the selected keywords: <strong>{selectedKeywords.join(", ")}</strong>
                </div>
              )}

              {questions.length > 0 && (
                <div className="mt-4">
                  <div className="flex flex-col gap-4">
                    {questions?.map((question) => (
                      <div key={question._id} className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">{question.question}</h4>
                            <div className="flex flex-wrap gap-2 mb-4">
                              {question.keyword.map((k, i) => (
                                <button
                                  key={i}
                                  onClick={() => !selectedKeywords.includes(k) && handleKeywordToggle(k)}
                                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    selectedKeywords.includes(k)
                                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                      : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                                  }`}
                                >
                                  {k}
                                </button>
                              ))}
                            </div>
                          </div>
                         
                          
                        </div>

                        <div className="space-y-4">
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Câu trả lời:</h5>
                            <div className="text-gray-600 whitespace-pre-wrap bg-gray-50 rounded-lg p-4 border border-gray-100">
                              {question.answer}
                            </div>
                          </div>

                          {question.images && question.images.length > 0 && (
                            <div>
                              <h5 className="text-sm font-medium text-gray-700 mb-2">Hình ảnh đính kèm:</h5>
                              <div className="grid grid-cols-3 gap-4">
                                {question.images.map((image, index) => {
                                  const imageUrl = typeof image === 'string' ? image : image.url;
                                  const fullImageUrl = getImageUrl(imageUrl);
                                  if (!fullImageUrl) return null;
                                  
                                  return (
                                    <div key={index} className="relative group rounded-lg overflow-hidden shadow-sm">
                                      <Image
                                        src={fullImageUrl}
                                        alt={`Answer image ${index + 1}`}
                                        width={300}
                                        height={200}
                                        className="w-full h-32 object-cover rounded-lg border border-gray-200"
                                        onError={(e) => {
                                          console.error(`Error loading image ${index + 1}:`, fullImageUrl);
                                          const target = e.target as HTMLImageElement;
                                          target.onerror = null;
                                          target.style.display = 'none';
                                        }}
                                      />
                                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity">
                                        <a
                                          href={fullImageUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100"
                                        >
                                          <span className="p-2 bg-white rounded-full">
                                            <ExternalLink size={16} className="text-gray-900" />
                                          </span>
                                        </a>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {question.createdAt && (
                            <div className="text-sm text-gray-500">
                              Ngày tạo: {new Date(question.createdAt).toLocaleDateString('vi-VN')}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {loading && (
                <div className="text-center mt-2 text-gray-500">
                  Loading...
                </div>
              )}
            </TabsContent>

            <TabsContent value="1">
              {tab === "1" && isLocked && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="bg-white p-8 rounded-lg">
                    <h2 className="text-xl font-bold mb-4">Nhập mật khẩu để truy cập</h2>
                    <input
                      type="password"
                      placeholder="Nhập mật khẩu"
                      value={passwordInput}
                      onChange={e => setPasswordInput(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => {
                          setShowPasswordDialog(false);
                          setTab(prevTab.toString());
                          setPasswordInput("");
                          setPasswordError("");
                        }}
                        className="px-4 py-2 bg-gray-200 rounded-md"
                      >
                        Quay lại
                      </button>
                      <button
                        onClick={() => {
                          if (passwordInput === "ChiPhuong") {
                            setIsLocked(false);
                            setShowPasswordDialog(false);
                            setPasswordInput("");
                            setPasswordError("");
                          } else {
                            setPasswordError("Mật khẩu không đúng!");
                          }
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md"
                      >
                        Xác nhận
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {tab === "1" && !isLocked && (
                <>
                  <div className="flex justify-end mb-4">
                    <button
                      onClick={() => setIsLocked(true)}
                      className="px-4 py-2 bg-red-600 text-white rounded-md"
                    >
                      Khoá lại
                    </button>
                  </div>
                  
                  <div className="border-b border-gray-200 mb-4">
                    <ShadcnTabs value={subTab} onValueChange={value => setSubTab(value)}>
                      <TabsList className="mb-4">
                        <TabsTrigger value="pending">Đang chờ</TabsTrigger>
                        <TabsTrigger value="done">Đã trả lời</TabsTrigger>
                        <TabsTrigger value="all">Tất cả</TabsTrigger>
                        <TabsTrigger value="add">Thêm câu hỏi</TabsTrigger>
                      </TabsList>

                      <TabsContent value="pending">
                        {subTab !== 'add' && (
                          <>
                            <div className="flex flex-wrap gap-3 items-center justify-between mb-4">
                              <div className="flex gap-2 items-center p-2 border border-gray-200 rounded-md flex-wrap">
                                <input
                                  type="text"
                                  placeholder="Tìm kiếm câu hỏi"
                                  value={searchQuestion}
                                  onChange={e => setSearchQuestion(e.target.value)}
                                  className="p-2 border border-gray-200 rounded-md min-w-[180px]"
                                />
                                <input
                                  type="text"
                                  placeholder="Tìm kiếm keyword"
                                  value={searchKeyword}
                                  onChange={e => setSearchKeyword(e.target.value)}
                                  className="p-2 border border-gray-200 rounded-md min-w-[180px]"
                                />
                                <select
                                  value={pendingSortBy}
                                  onChange={(e) => setPendingSortBy(e.target.value as 'createdAt' | 'updatedAt')}
                                  className="p-2 border border-gray-200 rounded-md"
                                >
                                  <option value="createdAt">Ngày tạo</option>
                                  <option value="updatedAt">Ngày cập nhật</option>
                                </select>
                                <select
                                  value={pendingSortOrder}
                                  onChange={(e) => setPendingSortOrder(e.target.value as 'asc' | 'desc')}
                                  className="p-2 border border-gray-200 rounded-md"
                                >
                                  <option value="desc">Mới nhất</option>
                                  <option value="asc">Cũ nhất</option>
                                </select>
                                <button
                                  onClick={() => {
                                    setSortBy(pendingSortBy);
                                    setSortOrder(pendingSortOrder);
                                  }}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-md"
                                >
                                  Áp dụng
                                </button>
                                <button
                                  onClick={() => {
                                    setPendingSortBy('createdAt');
                                    setPendingSortOrder('desc');
                                    setSortBy('createdAt');
                                    setSortOrder('desc');
                                    setSearchQuestion("");
                                    setSearchKeyword("");
                                  }}
                                  className="px-4 py-2 bg-gray-200 rounded-md"
                                >
                                  Clear
                                </button>
                              </div>
                            </div>

                            {(searchQuestion.trim() !== '' || searchKeyword.trim() !== '') && (
                              <div className="mb-6">
                                <div className="text-lg font-semibold text-blue-700 mb-2">Kết quả tìm kiếm</div>
                                {(() => {
                                  let filtered = crudQuestions;
                                  if (searchQuestion.trim()) {
                                    filtered = filtered.filter(q => q.question.toLowerCase().includes(searchQuestion.trim().toLowerCase()));
                                  }
                                  if (searchKeyword.trim()) {
                                    filtered = filtered.filter(q => (Array.isArray(q.keyword) ? q.keyword : [q.keyword]).some(kw => kw.toLowerCase().includes(searchKeyword.trim().toLowerCase())));
                                  }
                                  filtered = [...filtered].sort((a, b) => {
                                    if (sortBy === 'createdAt') {
                                      return sortOrder === 'desc'
                                        ? new Date(b._id).getTime() - new Date(a._id).getTime()
                                        : new Date(a._id).getTime() - new Date(b._id).getTime();
                                    } else {
                                      return sortOrder === 'desc'
                                        ? new Date(((b as any)?.updatedAt || b._id)).getTime() - new Date(((a as any)?.updatedAt || a._id)).getTime()
                                        : new Date(((a as any)?.updatedAt || a._id)).getTime() - new Date(((b as any)?.updatedAt || b._id)).getTime();
                                    }
                                  });
                                  if (filtered.length === 0) {
                                    return <div className="text-blue-500">Không tìm thấy kết quả phù hợp.</div>;
                                  }
                                  return <CrudTable crudQuestions={filtered} handleCrudEdit={handleCrudEdit} handleCrudDelete={handleCrudDelete} handleSortChange={handleSortChange} getSortIcon={getSortIcon} />;
                                })()}
                              </div>
                            )}
                          </>
                        )}
                      </TabsContent>

                      <TabsContent value="add">
                        <div className="max-w-md mx-auto p-8 mb-10 rounded-2xl shadow-lg">
                          <h2 className="text-center text-2xl font-bold text-blue-700 mb-6">
                            Thêm câu hỏi mới
                          </h2>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Câu hỏi <span className="text-red-500">*</span>
                              </label>
                              <textarea
                                value={form.question}
                                onChange={(e) => setForm({ ...form, question: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                rows={3}
                                placeholder="Nhập câu hỏi..."
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Từ khóa <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={form.keyword}
                                onChange={(e) => setForm({ ...form, keyword: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Nhập từ khóa, phân cách bằng dấu phẩy..."
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Câu trả lời <span className="text-red-500">*</span>
                              </label>
                              <textarea
                                value={form.answer}
                                onChange={(e) => setForm({ ...form, answer: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                rows={4}
                                placeholder="Nhập câu trả lời..."
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Hình ảnh
                              </label>
                              <div className="flex items-center gap-4">
                                <button
                                  type="button"
                                  onClick={() => document.getElementById('crud-images')?.click()}
                                  className="flex items-center gap-2 px-4 py-2 border-2 border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                                  disabled={isSubmitting}
                                >
                                  <ImageIcon size={20} />
                                  Chọn hình ảnh
                                </button>
                                <p className="text-sm text-gray-500">Hỗ trợ: JPG, PNG (Tối đa 5MB)</p>
                                <input
                                  id="crud-images"
                                  type="file"
                                  multiple
                                  accept="image/*"
                                  onChange={handleNewQuestionImageSelect}
                                  className="hidden"
                                  disabled={isSubmitting}
                                />
                              </div>

                              {newQuestionImages.length > 0 && (
                                <div className="grid grid-cols-3 gap-4 mt-4">
                                  {newQuestionImages.map((file, index) => (
                                    <div key={index} className="relative group rounded-lg overflow-hidden shadow-sm">
                                      <Image
                                        src={URL.createObjectURL(file)}
                                        alt={`Preview ${index + 1}`}
                                        width={300}
                                        height={200}
                                        className="w-full h-32 object-cover"
                                      />
                                      <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button
                                          type="button"
                                          onClick={() => removeNewQuestionImage(index)}
                                          className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                                          disabled={isSubmitting}
                                        >
                                          <Trash2 size={16} />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {submitError && (
                              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                                <p className="text-red-600">{submitError}</p>
                              </div>
                            )}

                            <div className="flex justify-end gap-4">
                              <button
                                type="button"
                                onClick={handleEditClose}
                                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                                disabled={isSubmitting}
                              >
                                Hủy
                              </button>
                              <button
                                type="button"
                                onClick={handleCrudSubmit}
                                disabled={isSubmitting || !form.question.trim() || !form.keyword.trim() || !form.answer.trim()}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                              >
                                {isSubmitting ? (
                                  <>
                                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                    Đang xử lý...
                                  </>
                                ) : (
                                  <>
                                    {editingId ? 'Cập nhật' : 'Thêm câu hỏi'}
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="done">
                        {/* Done questions list */}
                      </TabsContent>

                      <TabsContent value="all">
                        <div className="flex flex-wrap gap-3 items-center justify-between mb-4">
                          <div className="flex gap-2 items-center p-2 border border-gray-200 rounded-md flex-wrap">
                            <input
                              type="text"
                              placeholder="Tìm kiếm câu hỏi"
                              value={searchQuestion}
                              onChange={e => setSearchQuestion(e.target.value)}
                              className="p-2 border border-gray-200 rounded-md min-w-[180px]"
                            />
                            <input
                              type="text"
                              placeholder="Tìm kiếm keyword"
                              value={searchKeyword}
                              onChange={e => setSearchKeyword(e.target.value)}
                              className="p-2 border border-gray-200 rounded-md min-w-[180px]"
                            />
                            <select
                              value={sortBy}
                              onChange={(e) => setSortBy(e.target.value)}
                              className="p-2 border border-gray-200 rounded-md"
                            >
                              <option value="createdAt">Ngày tạo</option>
                              <option value="updatedAt">Ngày cập nhật</option>
                              <option value="question">Câu hỏi</option>
                              <option value="keyword">Từ khóa</option>
                              <option value="answer">Câu trả lời</option>
                            </select>
                            <select
                              value={sortOrder}
                              onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
                              className="p-2 border border-gray-200 rounded-md"
                            >
                              <option value="desc">Giảm dần</option>
                              <option value="asc">Tăng dần</option>
                            </select>
                            <button
                              onClick={() => {
                                setSortBy("createdAt");
                                setSortOrder("desc");
                                setSearchQuestion("");
                                setSearchKeyword("");
                              }}
                              className="px-4 py-2 bg-gray-200 rounded-md"
                            >
                              Đặt lại
                            </button>
                          </div>
                        </div>

                        {(searchQuestion.trim() !== '' || searchKeyword.trim() !== '') ? (
                          <div className="mb-8 bg-white rounded-lg p-6 shadow-sm border border-blue-100">
                            <div className="flex items-center justify-between mb-4">
                              <div className="text-lg font-semibold text-blue-700">Kết quả tìm kiếm</div>
                              <div className="text-sm text-gray-500">
                                {searchQuestion && <span>Câu hỏi: &ldquo;{searchQuestion}&rdquo; </span>}
                                {searchKeyword && <span>Từ khóa: &ldquo;{searchKeyword}&rdquo;</span>}
                              </div>
                            </div>
                            {(() => {
                              let filtered = crudQuestions;
                              if (searchQuestion.trim()) {
                                filtered = filtered.filter(q => q.question.toLowerCase().includes(searchQuestion.trim().toLowerCase()));
                              }
                              if (searchKeyword.trim()) {
                                filtered = filtered.filter(q => (Array.isArray(q.keyword) ? q.keyword : [q.keyword]).some(kw => kw.toLowerCase().includes(searchKeyword.trim().toLowerCase())));
                              }
                              filtered = [...filtered].sort((a, b) => {
                                if (sortBy === 'createdAt') {
                                  return sortOrder === 'desc'
                                    ? new Date(b._id).getTime() - new Date(a._id).getTime()
                                    : new Date(a._id).getTime() - new Date(b._id).getTime();
                                } else {
                                  return sortOrder === 'desc'
                                    ? new Date(((b as any)?.updatedAt || b._id)).getTime() - new Date(((a as any)?.updatedAt || a._id)).getTime()
                                    : new Date(((a as any)?.updatedAt || a._id)).getTime() - new Date(((b as any)?.updatedAt || b._id)).getTime();
                                }
                              });
                              if (filtered.length === 0) {
                                return (
                                  <div className="text-center py-8">
                                    <div className="text-blue-500">Không tìm thấy kết quả phù hợp.</div>
                                    <button
                                      onClick={() => {
                                        setSearchQuestion("");
                                        setSearchKeyword("");
                                      }}
                                      className="mt-2 text-sm text-gray-600 hover:text-blue-600"
                                    >
                                      Xóa tìm kiếm
                                    </button>
                                  </div>
                                );
                              }
                              return (
                                <>
                                  <div className="text-sm text-gray-500 mb-4">
                                    Tìm thấy {filtered.length} kết quả
                                  </div>
                                  <CrudTable 
                                    crudQuestions={filtered} 
                                    handleCrudEdit={handleCrudEdit} 
                                    handleCrudDelete={handleCrudDelete} 
                                    handleSortChange={handleSortChange}
                                    getSortIcon={getSortIcon}
                                  />
                                </>
                              );
                            })()}
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg font-semibold text-gray-900">Danh sách tất cả câu hỏi</h3>
                              <div className="text-sm text-gray-500">
                                Tổng số: {crudQuestions.length} câu hỏi
                              </div>
                            </div>
                            <div className="bg-white rounded-lg shadow-sm">
                              <CrudTable 
                                crudQuestions={crudQuestions} 
                                handleCrudEdit={handleCrudEdit} 
                                handleCrudDelete={handleCrudDelete} 
                                handleSortChange={handleSortChange}
                                getSortIcon={getSortIcon}
                              />
                            </div>
                          </div>
                        )}
                      </TabsContent>
                    </ShadcnTabs>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="2">
              <div className="space-y-6">
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Câu hỏi mới
                    </label>
                    <textarea
                      value={saleNewQuestion}
                      onChange={(e) => setSaleNewQuestion(e.target.value)}
                      placeholder="Nhập câu hỏi..."
                      className="w-full p-2 border border-gray-300 rounded-md"
                      rows={3}
                    />
                  </div>

                  <div className="mb-4">
                    {/* <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hình ảnh đính kèm
                    </label> */}
                    <div className="flex items-center gap-4">
                      {/* <button
                        type="button"
                        onClick={() => document.getElementById('sale-images')?.click()}
                        className="flex items-center gap-2 px-4 py-2 border-2 border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        <ImageIcon size={20} />
                        Chọn hình ảnh
                      </button> */}
                      {/* <p className="text-sm text-gray-500">Hỗ trợ: JPG, PNG (Tối đa 5MB)</p> */}
                      <input
                        id="sale-images"
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleSaleImageSelect}
                        className="hidden"
                      />
                    </div>

                    {saleImagePreviewUrls.length > 0 && (
                      <div className="grid grid-cols-3 gap-4 mt-4">
                        {saleImagePreviewUrls.map((url, index) => (
                          <div key={index} className="relative group rounded-lg overflow-hidden shadow-sm">
                            <Image
                              src={url}
                              alt={`Preview ${index + 1}`}
                              width={300}
                              height={200}
                              className="w-full h-32 object-cover"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => removeSaleImage(index)}
                                className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={addSaleQuestion}
                      disabled={!saleNewQuestion.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
                    >
                      <PlusCircle size={20} className="inline mr-2" />
                      Thêm câu hỏi
                    </button>
                  </div>
                </div>

                <div className="flex gap-4 mb-6">
                  <button
                    onClick={() => setSaleCurrentTab('pending')}
                    className={`px-4 py-2 rounded-md ${
                      saleCurrentTab === 'pending'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    Đang chờ
                  </button>
                  <button
                    onClick={() => setSaleCurrentTab('done')}
                    className={`px-4 py-2 rounded-md ${
                      saleCurrentTab === 'done'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    Đã trả lời
                  </button>
                </div>

                {saleFilteredQuestions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {saleCurrentTab === 'pending'
                      ? 'Không có câu hỏi nào đang chờ'
                      : 'Không có câu hỏi nào đã trả lời'}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {saleFilteredQuestions.map((question) => (
                      <div key={question.id} className="bg-white rounded-lg p-6 shadow-sm">
                        <div className="mb-4">
                          <h3 className="font-medium text-gray-900">Câu hỏi:</h3>
                          <p className="mt-1 text-gray-700">{question.text}</p>
                        </div>

                        {saleCurrentTab === 'pending' ? (
                          <>
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Câu trả lời
                              </label>
                              <textarea
                                value={saleAnswers[question.id] || ''}
                                onChange={(e) => handleSaleAnswerChange(question.id, e.target.value)}
                                placeholder="Nhập câu trả lời..."
                                className="w-full p-2 border border-gray-300 rounded-md"
                                rows={3}
                              />
                            </div>

                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Hình ảnh đính kèm
                              </label>
                              <div className="flex items-center gap-4">
                                <button
                                  type="button"
                                  onClick={() => document.getElementById(`answer-images-${question.id}`)?.click()}
                                  className="flex items-center gap-2 px-4 py-2 border-2 border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                                >
                                  <ImageIcon size={20} />
                                  Chọn hình ảnh
                                </button>
                                <input
                                  id={`answer-images-${question.id}`}
                                  type="file"
                                  multiple
                                  accept="image/*"
                                  onChange={(e) => handleImageSelect(e, question.id)}
                                  className="hidden"
                                />
                              </div>

                              {questionImages[question.id]?.length > 0 && (
                                <div className="grid grid-cols-3 gap-4 mt-4">
                                  {questionImages[question.id].map((file, index) => (
                                    <div key={index} className="relative group rounded-lg overflow-hidden shadow-sm">
                                      <Image
                                        src={URL.createObjectURL(file)}
                                        alt={`Answer image ${index + 1}`}
                                        width={300}
                                        height={200}
                                        className="w-full h-32 object-cover"
                                      />
                                      <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button
                                          type="button"
                                          onClick={() => removeImage(question.id, index)}
                                          className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                                        >
                                          <Trash2 size={16} />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => deleteSaleQuestion(question.id)}
                                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 size={16} className="inline mr-2" />
                                Xóa
                              </button>
                              <button
                                onClick={() => answerSaleQuestion(question.id)}
                                disabled={!saleAnswers[question.id]?.trim()}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
                              >
                                Trả lời
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="mb-4">
                              <h3 className="font-medium text-gray-900">Câu trả lời:</h3>
                              <p className="mt-1 text-gray-700">{question.answer}</p>
                            </div>

                            {question.images && question.images.length > 0 && (
                              <div className="mt-2">
                                <h3 className="text-sm font-medium text-gray-700 mb-2">Hình ảnh đính kèm:</h3>
                                <div className="grid grid-cols-3 gap-4">
                                  {question.images.map((image, index) => {
                                    const imageUrl = typeof image === 'string' ? image : image.url;
                                    const fullImageUrl = getImageUrl(imageUrl);
                                    if (!fullImageUrl) return null;
                                    
                                    return (
                                      <div key={index} className="relative group rounded-lg overflow-hidden shadow-sm">
                                        <Image
                                          src={fullImageUrl}
                                          alt={`Answer image ${index + 1}`}
                                          width={300}
                                          height={200}
                                          className="w-full h-32 object-cover rounded-lg border border-gray-200"
                                          onError={(e) => {
                                            console.error(`Error loading image ${index + 1}:`, fullImageUrl);
                                            const target = e.target as HTMLImageElement;
                                            target.onerror = null;
                                            target.style.display = 'none';
                                          }}
                                        />
                                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity">
                                          <a
                                            href={fullImageUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100"
                                          >
                                            <span className="p-2 bg-white rounded-full">
                                              <ExternalLink size={16} className="text-gray-900" />
                                            </span>
                                          </a>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => {
                                  handleSaleAnswerChange(question.id, question.answer || "");
                                  resetSaleToPending(question.id);
                                }}
                                className="flex items-center gap-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                              >
                                <Edit size={16} />
                                Sửa
                              </button>
                              <button
                                onClick={() => deleteSaleQuestion(question.id)}
                                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 size={16} className="inline mr-2" />
                                Xóa
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </ShadcnTabs>
          
          <ScrollToTop />
        </div>
      </div>

      {/* Edit Dialog */}
      {editOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Sửa câu hỏi
              </h2>
              <button
                onClick={handleEditClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Câu hỏi <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.question}
                  onChange={(e) => setForm({ ...form, question: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Nhập câu hỏi..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Từ khóa <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.keyword}
                  onChange={(e) => setForm({ ...form, keyword: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nhập từ khóa, phân cách bằng dấu phẩy..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Câu trả lời <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.answer}
                  onChange={(e) => setForm({ ...form, answer: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  placeholder="Nhập câu trả lời..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hình ảnh
                </label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => document.getElementById('edit-images')?.click()}
                    className="flex items-center gap-2 px-4 py-2 border-2 border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                    disabled={isSubmitting}
                  >
                    <ImageIcon size={20} />
                    Chọn hình ảnh
                  </button>
                  <p className="text-sm text-gray-500">Hỗ trợ: JPG, PNG (Tối đa 5MB)</p>
                  <input
                    id="edit-images"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleEditImageSelect}
                    className="hidden"
                    disabled={isSubmitting}
                  />
                </div>

                {editImagePreviews.length > 0 && (
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    {editImagePreviews.map((url, index) => (
                      <div key={index} className="relative group rounded-lg overflow-hidden shadow-sm">
                        <Image
                          src={url}
                          alt={`Preview ${index + 1}`}
                          width={300}
                          height={200}
                          className="w-full h-32 object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => removeEditImage(index)}
                            className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                            disabled={isSubmitting}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {submitError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-600">{submitError}</p>
                </div>
              )}

              <div className="flex justify-end gap-4 mt-6">
                <button
                  type="button"
                  onClick={handleEditClose}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  disabled={isSubmitting}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleCrudSubmit}
                  disabled={isSubmitting || !form.question.trim() || !form.keyword.trim() || !form.answer.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Đang xử lý...
                    </>
                  ) : (
                    'Cập nhật'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {successMsg && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg">
          {successMsg}
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
          {errorMsg}
        </div>
      )}

      {/* Pagination */}
      {crudTotal > 0 ? (
        <div className="mt-6 flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6 rounded-lg shadow-sm">
          <div className="flex items-center">
            <p className="text-sm text-gray-700">
              Hiển thị <span className="font-medium">{Math.min((crudPage - 1) * 10 + 1, crudTotal)}</span> đến{' '}
              <span className="font-medium">
                {Math.min(crudPage * 10, crudTotal)}
              </span>{' '}
              trong tổng số <span className="font-medium">{crudTotal}</span> câu hỏi
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchCrudQuestions(1)}
              disabled={crudPage === 1}
              className="relative inline-flex items-center px-2 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="sr-only">Trang đầu</span>
              <ChevronsLeft size={16} />
            </button>
            <button
              onClick={() => fetchCrudQuestions(crudPage - 1)}
              disabled={crudPage === 1}
              className="relative inline-flex items-center px-2 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="sr-only">Trang trước</span>
              <ChevronLeft size={16} />
            </button>
            <span className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md">
              {crudPage} / {Math.max(1, Math.ceil(crudTotal / 10))}
            </span>
            <button
              onClick={() => fetchCrudQuestions(crudPage + 1)}
              disabled={crudPage * 10 >= crudTotal}
              className="relative inline-flex items-center px-2 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="sr-only">Trang sau</span>
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => fetchCrudQuestions(Math.ceil(crudTotal / 10))}
              disabled={crudPage * 10 >= crudTotal}
              className="relative inline-flex items-center px-2 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="sr-only">Trang cuối</span>
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-6 text-center py-8 bg-white rounded-lg shadow-sm">
          <p className="text-gray-500">Không có câu hỏi nào</p>
          <button
            onClick={() => fetchCrudQuestions(1)}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
          >
            Tải lại dữ liệu
          </button>
        </div>
      )}
    </div>
  );
} 