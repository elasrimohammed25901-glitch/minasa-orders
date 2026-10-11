import React, { useState, useRef } from 'react';
import { 
  Plus, 
  Search, 
  FileSpreadsheet, 
  Edit3, 
  Trash2, 
  X, 
  TrendingUp,
  Image as ImageIcon,
  Palette,
  Upload,
  Check,
  Sparkles
} from 'lucide-react';
import { Product, ProductColorVariant } from '../types';
import { exportProductsToExcel } from '../utils/export';
import { triggerHaptic } from '../utils/haptics';
import { CURRENCY } from '../utils/currency';

interface ProductsViewProps {
  products: Product[];
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
}

const PRESET_PRODUCT_IMAGES = [
  { label: 'عباية سوداء ملكية', url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80' },
  { label: 'عباية كلوش كاجوال', url: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600&auto=format&fit=crop&q=80' },
  { label: 'طقم حجاب شيفون', url: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=600&auto=format&fit=crop&q=80' },
  { label: 'شال كريب قطني', url: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=600&auto=format&fit=crop&q=80' },
  { label: 'جلابة مغربية راقية', url: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600&auto=format&fit=crop&q=80' },
  { label: 'إسدال صلاة حريري', url: 'https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?w=600&auto=format&fit=crop&q=80' },
  { label: 'فستان طويل محتشم', url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&auto=format&fit=crop&q=80' },
  { label: 'كيمونو ستايل دبي', url: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600&auto=format&fit=crop&q=80' }
];

const PRESET_COLORS = [
  { name: 'أسود ملكي', hex: '#111827', img: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80' },
  { name: 'كحلي داكن', hex: '#1e3a8a', img: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&auto=format&fit=crop&q=80' },
  { name: 'عنابي / برغندي', hex: '#881337', img: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&auto=format&fit=crop&q=80' },
  { name: 'بيج كشميري', hex: '#d4b996', img: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600&auto=format&fit=crop&q=80' },
  { name: 'أخضر زمردي', hex: '#047857', img: 'https://images.unsplash.com/photo-1618244972963-dbee1a7edc95?w=600&auto=format&fit=crop&q=80' },
  { name: 'زيتي ملكي', hex: '#3f6212', img: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80' },
  { name: 'أزرق ملكي', hex: '#2563eb', img: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600&auto=format&fit=crop&q=80' },
  { name: 'وردي بودري', hex: '#f472b6', img: 'https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=600&auto=format&fit=crop&q=80' },
  { name: 'أبيض لؤلؤي', hex: '#f8fafc', img: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=600&auto=format&fit=crop&q=80' }
];

export const ProductsView: React.FC<ProductsViewProps> = ({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('عبايات');
  const [costPrice, setCostPrice] = useState<number>(120);
  const [sellingPrice, setSellingPrice] = useState<number>(250);
  const [defaultCommission, setDefaultCommission] = useState<number>(25);
  const [stock, setStock] = useState<number>(50);
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [colors, setColors] = useState<ProductColorVariant[]>([]);

  // New color inline inputs
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#111827');
  const [newColorImage, setNewColorImage] = useState('');

  const productFileInputRef = useRef<HTMLInputElement>(null);
  const colorFileInputRef = useRef<HTMLInputElement>(null);

  // Extract unique categories
  const categories = Array.from(new Set(products.map(p => p.category)));

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleOpenAdd = () => {
    triggerHaptic('heavy');
    setEditingProduct(null);
    setName('');
    setCategory(categories[0] || 'عبايات');
    setCostPrice(120);
    setSellingPrice(250);
    setDefaultCommission(25);
    setStock(30);
    setSku(`ABY-${Math.floor(100 + Math.random() * 900)}`);
    setDescription('');
    setImageUrl(PRESET_PRODUCT_IMAGES[0].url);
    setColors([
      {
        id: `col_${Date.now()}_1`,
        name: 'أسود ملكي فاخر',
        hexColor: '#111827',
        imageUrl: PRESET_PRODUCT_IMAGES[0].url
      },
      {
        id: `col_${Date.now()}_2`,
        name: 'كحلي داكن ملكي',
        hexColor: '#1e3a8a',
        imageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&auto=format&fit=crop&q=80'
      }
    ]);
    setNewColorName('');
    setNewColorHex('#881337');
    setNewColorImage('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    triggerHaptic('selection');
    setEditingProduct(p);
    setName(p.name);
    setCategory(p.category);
    setCostPrice(p.costPrice);
    setSellingPrice(p.sellingPrice);
    setDefaultCommission(p.defaultCommission);
    setStock(p.stock);
    setSku(p.sku);
    setDescription(p.description || '');
    setImageUrl(p.imageUrl || PRESET_PRODUCT_IMAGES[0].url);
    setColors(p.colors || [
      {
        id: `col_${Date.now()}`,
        name: 'اللون الافتراضي',
        hexColor: '#111827',
        imageUrl: p.imageUrl || PRESET_PRODUCT_IMAGES[0].url
      }
    ]);
    setNewColorName('');
    setNewColorHex('#111827');
    setNewColorImage('');
    setIsModalOpen(true);
  };

  // Image file upload handler
  const handleProductImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        setImageUrl(result);
        triggerHaptic('success');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleColorImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        setNewColorImage(result);
        triggerHaptic('success');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddColor = () => {
    if (!newColorName.trim()) {
      alert('يرجى كتابة اسم اللون أولاً (مثال: أسود، عنابي، بيج)');
      return;
    }
    triggerHaptic('selection');
    const newVariant: ProductColorVariant = {
      id: `col_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: newColorName.trim(),
      hexColor: newColorHex,
      imageUrl: newColorImage || imageUrl || PRESET_PRODUCT_IMAGES[0].url
    };
    setColors([...colors, newVariant]);
    setNewColorName('');
    setNewColorImage('');
  };

  const handleRemoveColor = (id: string) => {
    triggerHaptic('warning');
    setColors(colors.filter(c => c.id !== id));
  };

  const handleAddPresetColor = (preset: typeof PRESET_COLORS[0]) => {
    triggerHaptic('selection');
    const newVariant: ProductColorVariant = {
      id: `col_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: preset.name,
      hexColor: preset.hex,
      imageUrl: preset.img
    };
    setColors([...colors, newVariant]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || costPrice <= 0 || sellingPrice <= 0) {
      triggerHaptic('warning');
      alert('يرجى التأكد من اسم المنتج والأسعار بشكل صحيح');
      return;
    }

    triggerHaptic('medium');

    const finalProductData = {
      name,
      category,
      costPrice,
      sellingPrice,
      defaultCommission,
      stock,
      sku,
      description,
      imageUrl: imageUrl || PRESET_PRODUCT_IMAGES[0].url,
      colors: colors.length > 0 ? colors : [
        {
          id: `col_default_${Date.now()}`,
          name: 'اللون الرئيسي',
          hexColor: '#111827',
          imageUrl: imageUrl || PRESET_PRODUCT_IMAGES[0].url
        }
      ]
    };

    if (editingProduct) {
      onUpdateProduct({
        ...editingProduct,
        ...finalProductData
      });
    } else {
      onAddProduct(finalProductData);
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-5 sm:p-6 rounded-sm border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900">كتالوج المنتجات وتحديد الأسعار والعمولات ({CURRENCY})</h2>
          <p className="text-xs text-slate-500 mt-1">
            إدارة تسعير الجملة والتكلفة، سعر البيع للمستهلك، والعمولة المخصصة للعامل بالدرهم المغربي
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            id="btn-export-products-excel"
            onClick={() => {
              triggerHaptic('light');
              exportProductsToExcel(products);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm font-medium transition active:scale-95 touch-manipulation"
            title="تصدير قائمة المنتجات إلى Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>تصدير إكسل</span>
          </button>

          <button
            id="btn-add-product"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold transition-all active:scale-95 touch-manipulation shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>منتج جديد +</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-sm border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
          <input
            type="text"
            placeholder="بحث باسم المنتج، رمز SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pr-9 pl-3 py-2.5 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
          />
        </div>

        <div className="w-full sm:w-60">
          <select
            value={selectedCategory}
            onChange={(e) => {
              triggerHaptic('selection');
              setSelectedCategory(e.target.value);
            }}
            className="w-full text-xs px-3 py-2.5 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
          >
            <option value="all">جميع التصنيفات</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Grid or Empty State */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-sm border border-slate-200 p-12 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-500 mx-auto flex items-center justify-center">
            <ImageIcon className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-slate-800">لا توجد منتجات مسجلة في الكتالوج حتى الآن</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              يمكن لمدير النظام (كمال بن عمامو) البدء بإضافة المنتجات وتحديد سعر التكلفة، سعر البيع للمستهلك، وعمولة المندوبين.
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-bold transition active:scale-95 touch-manipulation shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة أول منتج للكتالوج +</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => {
          const marginAmount = product.sellingPrice - product.costPrice - product.defaultCommission;
          const marginPercent = product.sellingPrice > 0 
            ? Math.round(((product.sellingPrice - product.costPrice) / product.sellingPrice) * 100) 
            : 0;
          const productColors = product.colors && product.colors.length > 0 ? product.colors : [];

          return (
            <div 
              key={product.id}
              className="bg-white rounded-md border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 hover:shadow-sm transition overflow-hidden"
            >
              <div>
                {/* Product Image Banner */}
                <div className="relative w-full h-44 bg-slate-100 overflow-hidden border-b border-slate-200">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover object-center transition duration-300 hover:scale-105"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50">
                      <ImageIcon className="w-8 h-8 mb-1 opacity-50" />
                      <span className="text-[10px]">لا توجد صورة</span>
                    </div>
                  )}

                  {/* Overlay Badges */}
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-900/80 text-white backdrop-blur-xs shadow-xs">
                      {product.category}
                    </span>
                  </div>

                  <div className="absolute top-2.5 left-2.5">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/90 text-slate-700 shadow-xs border border-slate-200 backdrop-blur-xs font-bold">
                      {product.sku}
                    </span>
                  </div>

                  <div className="absolute bottom-2 right-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded shadow-xs ${
                      product.stock > 10 ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
                    }`}>
                      المخزون: {product.stock} قطعة
                    </span>
                  </div>
                </div>

                <div className="p-4 sm:p-5">
                  <h3 className="font-bold text-slate-900 text-sm leading-snug">{product.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {product.description || 'لا يوجد وصف تفصيلي'}
                  </p>

                  {/* Colors Preview Strip (Names & Images) */}
                  {productColors.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100">
                      <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1.5 font-semibold">
                        <span className="flex items-center gap-1">
                          <Palette className="w-3 h-3 text-purple-600" />
                          <span>الألوان المتوفرة ({productColors.length}):</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                        {productColors.map((col) => (
                          <div
                            key={col.id}
                            className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded px-1.5 py-1 shrink-0 text-[10px] text-slate-700 shadow-2xs"
                            title={col.name}
                          >
                            <img
                              src={col.imageUrl}
                              alt={col.name}
                              className="w-5 h-5 rounded-full object-cover border border-slate-300"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = product.imageUrl || '';
                              }}
                            />
                            <span 
                              className="w-2.5 h-2.5 rounded-full shrink-0 border border-slate-300"
                              style={{ backgroundColor: col.hexColor || '#333' }}
                            />
                            <span className="font-medium whitespace-nowrap">{col.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Price Breakdown Matrix */}
                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100 text-center text-xs">
                    <div className="p-2 rounded bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">التكلفة</span>
                      <span className="font-bold text-slate-800 font-mono">{product.costPrice.toLocaleString()} {CURRENCY}</span>
                    </div>

                    <div className="p-2 rounded bg-blue-50 border border-blue-200">
                      <span className="text-[10px] text-blue-800 block font-bold">البيع</span>
                      <span className="font-bold text-blue-900 font-mono">{product.sellingPrice.toLocaleString()} {CURRENCY}</span>
                    </div>

                    <div className="p-2 rounded bg-yellow-50 border border-yellow-200">
                      <span className="text-[10px] text-yellow-800 block font-bold">العمولة</span>
                      <span className="font-bold text-yellow-900 font-mono">{product.defaultCommission.toLocaleString()} {CURRENCY}</span>
                    </div>
                  </div>

                  {/* Margin & Profit Preview */}
                  <div className="flex items-center justify-between mt-3 text-xs bg-slate-50 p-2.5 rounded border border-slate-200">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <TrendingUp className="w-3.5 h-3.5 text-green-600" />
                      <span>صافي ربح القطعة:</span>
                    </div>
                    <div className="text-left font-bold">
                      <span className="text-green-700 font-mono">{marginAmount.toLocaleString()} {CURRENCY}</span>{' '}
                      <span className="text-[10px] text-slate-400 font-normal">({marginPercent}%)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 px-4 py-3 bg-slate-50/50 border-t border-slate-100">
                <button
                  onClick={() => handleOpenEdit(product)}
                  className="flex items-center gap-1 text-xs text-slate-700 hover:text-blue-600 px-2.5 py-1.5 rounded hover:bg-white border border-slate-200 transition active:scale-90 font-medium"
                  title="تعديل المنتج والأسعار والصور"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>تعديل</span>
                </button>

                <button
                  onClick={() => {
                    triggerHaptic('warning');
                    if (confirm(`هل أنت متأكد من حذف المنتج: ${product.name}؟`)) {
                      onDeleteProduct(product.id);
                    }
                  }}
                  className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 px-2.5 py-1.5 rounded hover:bg-red-50 border border-transparent hover:border-red-200 transition active:scale-90 font-medium"
                  title="حذف المنتج"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>حذف</span>
                </button>
              </div>

            </div>
          );
        })}
      </div>
      )}

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-md shadow-2xl max-w-2xl w-full p-5 sm:p-6 border border-slate-200 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 sticky top-0 bg-white z-10">
              <div>
                <h3 className="font-bold text-slate-800 text-base">
                  {editingProduct ? 'تعديل بيانات المنتج والصور والألوان' : 'إضافة منتج جديد مع الصور والألوان'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  إدخال تفاصيل الموديل، الصورة، والتدرجات اللونية لتسهيل تسجيل الطلبيات
                </p>
              </div>
              <button 
                onClick={() => {
                  triggerHaptic('light');
                  setIsModalOpen(false);
                }} 
                className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:scale-90"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs text-right">
              {/* Product Basic Info */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم المنتج *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: عباية سوداء ملكية فاخرة مطرزة"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">التصنيف *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: عبايات أو حجابات"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">رمز المخزون (SKU)</label>
                  <input
                    type="text"
                    placeholder="مثال: ABY-101"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              {/* Main Product Image Section */}
              <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                    <ImageIcon className="w-4 h-4 text-blue-600" />
                    <span>صورة المنتج الرئيسية *</span>
                  </label>
                  <span className="text-[10px] text-slate-500">رابط مباشر أو رفع من الجهاز</span>
                </div>

                <div className="flex gap-3 items-start">
                  {/* Image Preview */}
                  <div className="w-20 h-20 rounded-md border-2 border-dashed border-slate-300 bg-white overflow-hidden shrink-0 flex items-center justify-center">
                    {imageUrl ? (
                      <img 
                        src={imageUrl} 
                        alt="معاينة المنتج" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = PRESET_PRODUCT_IMAGES[0].url;
                        }}
                      />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-slate-300" />
                    )}
                  </div>

                  {/* Input & Upload */}
                  <div className="flex-1 space-y-2">
                    <input
                      type="url"
                      placeholder="أدخل رابط صورة المنتج (URL)..."
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-md border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />

                    <div className="flex items-center gap-2">
                      <input 
                        type="file" 
                        ref={productFileInputRef} 
                        onChange={handleProductImageUpload} 
                        accept="image/*" 
                        className="hidden" 
                      />
                      <button
                        type="button"
                        onClick={() => productFileInputRef.current?.click()}
                        className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-50 rounded text-[11px] font-semibold text-slate-700 flex items-center gap-1 shadow-2xs"
                      >
                        <Upload className="w-3 h-3 text-slate-600" />
                        <span>رفع صورة من الجهاز</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick Presets */}
                <div>
                  <span className="text-[10px] text-slate-500 block mb-1">صور جاهزة سريعة:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_PRODUCT_IMAGES.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          triggerHaptic('selection');
                          setImageUrl(preset.url);
                        }}
                        className={`text-[10px] px-2 py-0.5 rounded border transition ${
                          imageUrl === preset.url 
                            ? 'bg-blue-600 text-white border-blue-600 font-bold' 
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Color Variants Section with Image and Name */}
              <div className="p-3.5 rounded-md bg-purple-50/50 border border-purple-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                    <Palette className="w-4 h-4 text-purple-600" />
                    <span>ألوان المنتج المتوفرة (بالصورة والاسم) *</span>
                  </label>
                  <span className="text-[10px] text-purple-800 font-semibold bg-purple-100 px-2 py-0.5 rounded-full">
                    {colors.length} ألوان محددة
                  </span>
                </div>

                <p className="text-[11px] text-slate-600 leading-relaxed">
                  عند تسجيل طلب جديد، ستظهر هذه الألوان للعامل بالصورة والاسم للاختيار السهل والدقيق.
                </p>

                {/* Current Colors List */}
                <div className="space-y-2">
                  {colors.map((color) => (
                    <div 
                      key={color.id} 
                      className="flex items-center justify-between gap-2 p-2 rounded bg-white border border-purple-100 shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <img 
                          src={color.imageUrl} 
                          alt={color.name} 
                          className="w-9 h-9 rounded object-cover border border-slate-200 shadow-2xs"
                        />
                        <span 
                          className="w-4 h-4 rounded-full border border-slate-300 shrink-0" 
                          style={{ backgroundColor: color.hexColor || '#333' }}
                        />
                        <div>
                          <span className="font-bold text-slate-900 block text-xs">{color.name}</span>
                          <span className="text-[9px] font-mono text-slate-400 truncate max-w-[180px] block">
                            {color.hexColor || 'بدون كود'}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveColor(color.id)}
                        className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition"
                        title="حذف هذا اللون"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add New Color Form */}
                <div className="p-3 bg-white rounded border border-purple-200 space-y-2.5">
                  <span className="text-[11px] font-bold text-slate-800 block">إضافة لون جديد:</span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="sm:col-span-2">
                      <label className="text-[10px] text-slate-500 block mb-0.5">اسم اللون (مثال: أسود ملكي، عنابي)</label>
                      <input
                        type="text"
                        placeholder="اسم اللون بالعربية..."
                        value={newColorName}
                        onChange={(e) => setNewColorName(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs focus:ring-1 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">رمز اللون</label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={newColorHex}
                          onChange={(e) => setNewColorHex(e.target.value)}
                          className="w-7 h-7 rounded border border-slate-300 p-0 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={newColorHex}
                          onChange={(e) => setNewColorHex(e.target.value)}
                          className="flex-1 px-1.5 py-1 rounded border border-slate-300 text-[10px] font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 block mb-0.5">صورة الموديل بهذا اللون (اختياري، يورث صورة المنتج إذا تُرك فارغاً)</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="url"
                        placeholder="رابط صورة هذا اللون..."
                        value={newColorImage}
                        onChange={(e) => setNewColorImage(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 rounded border border-slate-300 text-xs font-mono"
                      />
                      <input 
                        type="file" 
                        ref={colorFileInputRef} 
                        onChange={handleColorImageUpload} 
                        accept="image/*" 
                        className="hidden" 
                      />
                      <button
                        type="button"
                        onClick={() => colorFileInputRef.current?.click()}
                        className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 rounded text-[11px] font-semibold text-slate-700 shrink-0"
                      >
                        رفع صورة
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddColor}
                    className="w-full py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded font-bold text-xs flex items-center justify-center gap-1 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة هذا اللون إلى قائمة المنتج</span>
                  </button>

                  {/* Preset Colors */}
                  <div className="pt-2 border-t border-purple-100">
                    <span className="text-[10px] text-slate-500 block mb-1">إضافة ألوان شائعة بضغطة واحدة:</span>
                    <div className="flex flex-wrap gap-1">
                      {PRESET_COLORS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleAddPresetColor(preset)}
                          className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-purple-100 text-slate-700 border border-slate-200 transition"
                        >
                          <span 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: preset.hex }} 
                          />
                          <span>+ {preset.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing Matrix */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">سعر التكلفة ({CURRENCY}) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    required
                    value={costPrice}
                    onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">سعر البيع ({CURRENCY}) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    required
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">عمولة العامل ({CURRENCY})</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={defaultCommission}
                    onChange={(e) => setDefaultCommission(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">الكمية المتوفرة في المخزون</label>
                <input
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">وصف المنتج ومواصفاته</label>
                <textarea
                  rows={2}
                  placeholder="وصف مختصر لمميزات المنتج والمقاسات ونوع القماش..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Live Margin Calculation Preview */}
              <div className="bg-slate-50 p-3 rounded-md border border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-700 font-bold">هامش الربح الصافي المتوقع لكل قطعة:</span>
                <span className="font-mono font-bold text-green-700 text-sm">
                  {(sellingPrice - costPrice - defaultCommission).toLocaleString()} {CURRENCY}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setIsModalOpen(false);
                  }}
                  className="px-4 py-2 rounded-md text-slate-600 hover:bg-slate-100 font-medium active:scale-95"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-bold active:scale-95 transition-all touch-manipulation shadow-xs"
                >
                  {editingProduct ? 'حفظ التعديلات' : 'إضافة المنتج إلى الكتالوج'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
