'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BookOpen, Calendar, User, Tag, Loader2, ArrowRight, Eye } from 'lucide-react';
import Footer from '@/components/layout/Footer';
import Card from '@/components/ui/Card';
import { api, ApiError } from '@/lib/api';

interface Blog {
  _id: string;
  title: string;
  slug?: string;
  content: string;
  excerpt?: string;
  image?: string;
  author?: {
    name?: string;
    email?: string;
  };
  category?: string;
  tags?: string[];
  views?: number;
  status: string;
  createdAt: string;
  publishedAt?: string;
}

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const response = await api.get<any>('/blogs?status=published');
      
      // Handle both array and object with data property
      let blogsData: any[] = [];
      if (Array.isArray(response)) {
        blogsData = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        blogsData = response.data;
      }
      
      // Filter only published blogs
      const publishedBlogs = blogsData.filter((blog: any) => 
        blog.status === 'published'
      );
      
      setBlogs(publishedBlogs);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        // Not logged in, but blogs should be public
        console.error('Failed to fetch blogs:', error);
      } else {
        console.error('Failed to fetch blogs:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(blogs.map(blog => blog.category).filter(Boolean))) as string[]];

  // Filter blogs by category
  const filteredBlogs = selectedCategory === 'all' 
    ? blogs 
    : blogs.filter(blog => blog.category === selectedCategory);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Truncate text
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#10b981]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-7 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Our Blog
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Stay updated with our latest stories, news, and insights
          </p>
        </div>

        {/* Category Filter */}
        {categories.length > 1 && (
          <div className="mb-8 flex flex-wrap gap-2 justify-center">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-[#10b981] text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        )}

        {filteredBlogs.length === 0 ? (
          <Card className="p-12 text-center">
            <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Blogs Found</h3>
            <p className="text-gray-600">
              {selectedCategory === 'all' 
                ? 'Check back soon for new blog posts!'
                : `No blogs found in ${selectedCategory} category.`}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredBlogs.map((blog) => (
              <Link key={blog._id} href={`/blogs/${blog._id}`}>
                <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer h-full flex flex-col">
                  {/* Blog Image */}
                  <div className="relative w-full h-48 bg-gray-200">
                    {blog.image ? (
                      <Image
                        src={blog.image}
                        alt={blog.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#10b981] to-[#059669]">
                        <BookOpen className="h-16 w-16 text-white opacity-50" />
                      </div>
                    )}
                    {blog.category && (
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 bg-[#10b981] text-white text-xs font-semibold rounded-full">
                          {blog.category}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Blog Content */}
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                        {blog.title}
                      </h3>
                      
                      {(blog.excerpt || blog.content) && (
                        <p className="text-gray-600 mb-4 line-clamp-3 text-sm">
                          {blog.excerpt || truncateText(blog.content.replace(/<[^>]*>/g, ''), 150)}
                        </p>
                      )}
                    </div>

                    {/* Blog Meta */}
                    <div className="pt-4 border-t border-gray-200 mt-auto">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                        <div className="flex items-center gap-3">
                          {blog.author?.name && (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>{blog.author.name}</span>
                            </div>
                          )}
                          {blog.createdAt && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(blog.createdAt)}</span>
                            </div>
                          )}
                        </div>
                        {blog.views !== undefined && (
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            <span>{blog.views}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Tags */}
                      {blog.tags && blog.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {blog.tags.slice(0, 3).map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {/* Read More */}
                      <div className="mt-4 flex items-center text-[#10b981] font-semibold text-sm group">
                        <span>Read More</span>
                        <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

