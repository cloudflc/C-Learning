import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores';
import { ShoppingCart, Trophy, Coins, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const Shop = () => {
  const { user } = useAuthStore();
  const [items, setItems] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userCoins, setUserCoins] = useState(0);

  useEffect(() => {
    fetchItems();
    fetchPurchases();
    if (user) {
      setUserCoins(user.coins || 0);
    }
  }, [user]);

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

  const handlePurchase = async (itemId) => {
    try {
      const response = await api.post(`/shop/purchase/${itemId}`);
      toast.success('购买成功！');
      setUserCoins(response.data.coins);
      fetchPurchases();
      fetchItems();
    } catch (error) {
      toast.error(error.response?.data?.message || '购买失败');
    }
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
          
          return (
            <div 
              key={item._id}
              className={purchased 
                ? 'card opacity-50' 
                : 'card hover:border-yellow-500/50 transition-all'}
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
    </div>
  );
};

export default Shop;
