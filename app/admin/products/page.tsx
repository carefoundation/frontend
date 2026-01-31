'use client';

import { useState, useEffect } from 'react';
import DataTable from '@/components/admin/DataTable';
import Button from '@/components/ui/Button';
import { Plus, Eye, Edit, Trash2, Package, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { showToast } from '@/lib/toast';
import ConfirmModal from '@/components/ui/ConfirmModal';
import ViewModal from '@/components/admin/ViewModal';

interface Product {
  _id?: string;
  id?: string;
  name: string;
  category: string;
  price: number;
  stock?: number;
  quantity?: number;
  status: 'active' | 'inactive';
}

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [fullProductData, setFullProductData] = useState<any>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get<Product[]>('/products');
      if (Array.isArray(response)) {
        const formatted = response.map((product: any) => ({
          id: product._id || product.id,
          _id: product._id,
          name: product.name || 'Untitled',
          category: product.category || 'General',
          price: product.price || 0,
          stock: product.stock || product.quantity || 0,
          status: product.status || 'active',
        }));
        setProducts(formatted);
      } else {
        setProducts([]);
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        window.location.href = '/login';
      } else {
        console.error('Failed to fetch products:', error);
      }
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (product: Product) => {
    try {
      const productId = product._id || product.id;
      if (!productId) {
        showToast('Product ID not found', 'error');
        return;
      }
      const data = await api.get<any>(`/products/${productId}`);
      setFullProductData(data);
      setSelectedProduct(product);
      setViewModalOpen(true);
    } catch (error) {
      if (error instanceof ApiError) {
        showToast(error.message, 'error');
      } else {
        showToast('Failed to fetch product details', 'error');
      }
      // Show with available data if fetch fails
      setSelectedProduct(product);
      setViewModalOpen(true);
    }
  };

  const handleEdit = (product: Product) => {
    const id = product._id || product.id;
    if (id) {
      router.push(`/admin/products/edit/${id}`);
    } else {
      showToast('Product ID not found', 'error');
    }
  };

  const handleDeleteClick = (product: Product) => {
    setSelectedProduct(product);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedProduct && (selectedProduct._id || selectedProduct.id)) {
      try {
        const id = selectedProduct._id || selectedProduct.id;
        setUpdating(String(id));
        await api.delete(`/products/${id}`);
        showToast('Product deleted successfully!', 'success');
        await fetchProducts();
        setSelectedProduct(null);
        setDeleteModalOpen(false);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          window.location.href = '/login';
        } else {
          showToast('Failed to delete product', 'error');
        }
      } finally {
        setUpdating(null);
      }
    }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#10b981]" />
      </div>
    );
  }

  const columns = [
    {
      header: 'Name',
      accessor: 'name' as keyof Product,
    },
    {
      header: 'Category',
      accessor: 'category' as keyof Product,
    },
    {
      header: 'Price',
      accessor: 'price' as keyof Product,
      render: (value: number) => `₹${value.toLocaleString()}`,
    },
    {
      header: 'Stock',
      accessor: 'stock' as keyof Product,
      render: (value: number) => (
        <span className={value > 0 ? 'text-[#10b981]' : 'text-red-600'}>
          {value}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status' as keyof Product,
      render: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {value}
        </span>
      ),
    },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Product Management</h1>
          <p className="text-gray-600">Add, edit, and delete products</p>
        </div>
        <Link href="/admin/products/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </Link>
      </div>
      <DataTable
        title=""
        columns={columns}
        data={products}
        actions={(row) => (
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            <Button 
              variant="ghost" 
              size="sm" 
              title="View"
              onClick={() => handleView(row)}
              disabled={updating === (row._id || row.id)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              title="Edit"
              onClick={() => handleEdit(row)}
              disabled={updating === (row._id || row.id)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => handleDeleteClick(row)}
              disabled={updating === (row._id || row.id)}
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      />

      {/* View Modal */}
      {fullProductData && (
        <ViewModal
          isOpen={viewModalOpen}
          onClose={() => {
            setViewModalOpen(false);
            setSelectedProduct(null);
            setFullProductData(null);
          }}
          title="Product Details"
          data={{
            'Name': fullProductData.name || 'N/A',
            'Category': fullProductData.category || 'N/A',
            'Price': `₹${(fullProductData.price || 0).toLocaleString()}`,
            'Stock': fullProductData.stock || fullProductData.quantity || 0,
            'Status': fullProductData.status || 'N/A',
            'Description': fullProductData.description || 'N/A',
            ...(fullProductData.image ? { 'Image': fullProductData.image } : {}),
          }}
        />
      )}

      {/* Delete Modal */}
      {selectedProduct && (
        <ConfirmModal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setSelectedProduct(null);
          }}
          title="Delete Product"
          message={`Are you sure you want to delete "${selectedProduct.name}"? This action cannot be undone and all data will be permanently removed.`}
          onConfirm={handleDeleteConfirm}
          confirmText="Delete"
          variant="danger"
        />
      )}
    </div>
  );
}

