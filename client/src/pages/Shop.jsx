import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores';
import { ShoppingCart, Trophy, Coins, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import ConfirmModal from '../components/ConfirmModal';

const Shop = () => {
  const { user, updateUser } = useAuthStore();
  const [items, setItems] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingPurchase, setPendingPurchase] = useState(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  
  // 从全局 store 获取金币数量
  const userCoins = user?.coins || 0;

  useEffect(() => {
    fetchItems();
    fetchPurchases();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await api.get('/shop/items');
      setItems(response.data);
    } catch (error) {
      toast.error('加载商品失败');
    }
  };

  const fetchPurchases = async () => {
    try {
      const response = await api.get('/shop/purchases');
      setPurchases(response.data);
    } catch (error) {
      console.error('Failed to fetch purchases:', error);
    }
  };

  const handlePurchaseClick = (itemId) => {
    const item = items.find(i => i._id === itemId);
    if (!item) return;
    
    // 检查金币是否足够
    if (userCoins < item.price) {
      toast.error(`金币不足！当前金币：${userCoins}，需要：${item.price}`);
      return;
    }
    
    setPendingPurchase(itemId);
    setShowConfirmModal(true);
  };

  const handleConfirmPurchase = async () => {
    if (!pendingPurchase) return;
    
    setIsPurchasing(true);
    
    try {
      console.log('=== PURCHASE DEBUG ===');
      console.log('pendingPurchase:', pendingPurchase);
      
      const response = await api.post(`/shop/purchase/${pendingPurchase}`);
      console.log('Response:', response.data);
      
      // 立即更新全局用户状态中的金币
      const newCoins = response.data.coins;
      console.log('Purchase success, new coins:', newCoins);
      
      if (updateUser) {
        updateUser({ coins: newCoins, ...(response.data.user || {}) });
      }
      
      const item = items.find(i => i._id === pendingPurchase);
      console.log('Purchased item:', item);
      toast.success(`成功购买 ${item?.name || '商品'}！`);
      
      // 刷新列表
      fetchPurchases();
      fetchItems();
      
      // 关闭弹窗
      setShowConfirmModal(false);
      setPendingPurchase(null);
    } catch (error) {
      console.error('=== PURCHASE ERROR ===');
      console.error('Error:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      const errorMessage = error.response?.data?.message || '购买失败';
      console.error('Error message:', errorMessage);
      toast.error(errorMessage);
      
      setShowConfirmModal(false);
      setPendingPurchase(null);
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleCloseModal = () => {
    setShowConfirmModal(false);
    setPendingPurchase(null);
  };

  const getItemTypeLabel = (type) => {
    const labels = {
      badge: '徽章',
      avatar: '头像',
      title: '称号',
      theme: '主题'
    };
    return labels[type] || type;
  };

  const isPurchased = (itemId) => {
    return purchases.some(p => p.item._id === itemId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">商城</h1>
        <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-yellow-500/20 border border-yellow-500/30">
          <Coins size={24} className="text-yellow-400" />
          <span className="text-2xl font-bold text-yellow-400">{userCoins}</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {items.map((item) => {
          const purchased = isPurchased(item._id);
          const canPurchase = item.stock !== 0 && item.isActive;
          const hasLimitedStock = item.stock > 0;
          
          return (
            <div 
              key={item._id}
              className={canPurchase
                ? 'card hover:border-yellow-500/50 transition-all'
                : 'card opacity-50'}
            >
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-lg bg-slate-700 flex items-center justify-center">
                  <span className="text-2xl">{item.type === 'badge' ? '🏅' : item.type === 'avatar' ? '👤' : item.type === 'title' ? '👑' : '🎨'}</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-2">{item.name}</h3>
                  {item.description && (
                    <p className="text-slate-400 text-sm mb-3">{item.description}</p>
                  )}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-yellow-400 font-bold text-2xl">{item.price}</span>
                    <span className="text-slate-400">金币</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-sm">类型：</span>
                    <span className="text-white text-sm bg-slate-700 px-2 py-1 rounded">{getItemTypeLabel(item.type)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-sm">库存：</span>
                    <span className={item.stock === -1 ? "text-green-400" : item.stock === 0 ? "text-red-400" : "text-slate-400"}>
                      {item.stock === -1 ? '无限' : item.stock === 0 ? '已售罄' : `${item.stock} 件`}
                    </span>
                  </div>
                  {purchased && (
                    <div className="mt-2 text-xs text-green-400 flex items-center gap-1">
                      <span>✓</span>
                      <span>已购买过</span>
                    </div>
                  )}
                  <button
                    onClick={() => handlePurchaseClick(item._id)}
                    disabled={item.stock === 0 || !item.isActive}
                    className={`mt-2 w-full py-2 rounded-lg font-bold transition-all ${
                      item.stock === 0 || !item.isActive
                        ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                        : userCoins < item.price
                        ? 'bg-yellow-600/50 text-yellow-200 cursor-not-allowed'
                        : 'bg-yellow-500 hover:bg-yellow-600 text-black'
                    }`}
                  >
                    {item.stock === 0 ? '已售罄' : !item.isActive ? '已下架' : userCoins < item.price ? '金币不足' : '购买'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {purchases.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-bold text-white mb-4">我的购买记录</h2>
          <div className="space-y-3">
            {purchases.map((purchase) => (
              <div 
                key={purchase._id}
                className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg border border-slate-600"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-primary-500 flex items-center justify-center">
                    <span className="text-lg">{purchase.item.type === 'badge' ? '🏅' : purchase.item.type === 'avatar' ? '👤' : purchase.item.type === 'title' ? '👑' : '🎨'}</span>
                  </div>
                  <div>
                    <div className="text-white font-medium">{purchase.item.name}</div>
                    <div className="text-slate-400 text-sm">
                      {new Date(purchase.purchasedAt).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="text-yellow-400 font-bold">{purchase.item.price} 金币</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {purchases.length === 0 && (
        <div className="card text-center py-12">
          <ShoppingCart size={48} className="text-slate-500 mx-auto mb-4" />
          <p className="text-slate-400">还没有购买任何商品</p>
          <p className="text-slate-500 text-sm">完成练习或打破纪录可以获得金币，快来商城兑换吧！</p>
        </div>
      )}

      {/* 购买确认对话框 */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={handleCloseModal}
        onConfirm={handleConfirmPurchase}
        isLoading={isPurchasing}
        title="🛒 购买确认"
        type="warning"
        message={(() => {
          const item = items.find(i => i._id === pendingPurchase);
          if (!item) return '';
          const purchased = isPurchased(pendingPurchase);
          const remainingCoins = userCoins - item.price;
          return `商品名称：${item.name}\n价格：${item.price} 金币\n当前金币：${userCoins} 金币\n购买后剩余：${remainingCoins} 金币\n${purchased ? '\n⚠️ 您已购买过此商品\n' : ''}`;
        })()}
        confirmText="确认购买"
        cancelText="取消"
      />
    </div>
  );
};

export default Shop;
