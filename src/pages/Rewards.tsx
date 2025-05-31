import { useState } from "react";
import { useAppState } from "@/contexts/AppStateContext";
import { Reward } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProgressBar } from "@/components/ui/progress-bar";

const Rewards = () => {
  const { 
    state, 
    addReward, 
    updateReward, 
    deleteReward, 
    getGroupById,
    redeemReward,
    getGroupEnergy,
    getAvailableRewards,
    getRedeemedRewards,
    getTotalEnergy
  } = useAppState();
  
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  
  // New reward form state
  const [newReward, setNewReward] = useState({
    name: "",
    groupId: "" as string | null,
    energyCost: 100,
    description: ""
  });
  
  // Edit reward form state
  const [editReward, setEditReward] = useState({
    id: "",
    name: "",
    groupId: "" as string | null,
    energyCost: 100,
    description: ""
  });
  
  const handleAddReward = () => {
    if (newReward.name.trim()) {
      const groupId = newReward.groupId === "global" ? null : newReward.groupId;
      addReward(
        newReward.name.trim(),
        groupId,
        Number(newReward.energyCost) || 100,
        newReward.description.trim()
      );
      
      setNewReward({
        name: "",
        groupId: "",
        energyCost: 100,
        description: ""
      });
      
      setIsAddDialogOpen(false);
    }
  };
  
  const handleEditReward = () => {
    if (editReward.name.trim()) {
      const groupId = editReward.groupId === "global" ? null : editReward.groupId;
      updateReward({
        id: editReward.id,
        name: editReward.name.trim(),
        groupId: groupId,
        energyCost: Number(editReward.energyCost) || 100,
        description: editReward.description.trim()
      });
      
      setEditingReward(null);
      setIsEditDialogOpen(false);
    }
  };
  
  const openEditDialog = (reward: Reward) => {
    setEditingReward(reward);
    setEditReward({
      id: reward.id,
      name: reward.name,
      groupId: reward.groupId === null ? "global" : reward.groupId,
      energyCost: reward.energyCost,
      description: reward.description || ""
    });
    setIsEditDialogOpen(true);
  };
  
  const handleRedeemReward = (rewardId: string) => {
    redeemReward(rewardId);
  };
  
  // Get rewards based on filter
  const availableRewards = selectedGroup === "all" 
    ? getAvailableRewards() 
    : selectedGroup === "global"
    ? getAvailableRewards(null)
    : getAvailableRewards(selectedGroup);
  
  const redeemedRewards = selectedGroup === "all" 
    ? getRedeemedRewards() 
    : selectedGroup === "global"
    ? getRedeemedRewards(null)
    : getRedeemedRewards(selectedGroup);
  
  return (
    <div className="container mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">奖励管理</h1>
        <div className="flex flex-col sm:flex-row gap-2 items-end sm:items-center">
          <Select 
            value={selectedGroup} 
            onValueChange={setSelectedGroup}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="选择分组" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部分组</SelectItem>
              <SelectItem value="global">公共池</SelectItem>
              {state.groups.map(group => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>添加奖励</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>添加新奖励</DialogTitle>
                <DialogDescription>
                  创建一个新的奖励并设置所需的能量值。
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    奖励名称
                  </label>
                  <Input
                    value={newReward.name}
                    onChange={e => setNewReward({...newReward, name: e.target.value})}
                    placeholder="例如：看一部电影"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    所属分组
                  </label>
                  <Select 
                    value={newReward.groupId || ""} 
                    onValueChange={value => setNewReward({...newReward, groupId: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择分组" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="global">公共池（可用所有能量兑换）</SelectItem>
                      {state.groups.map(group => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    所需能量值
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={newReward.energyCost}
                    onChange={e => setNewReward({...newReward, energyCost: parseInt(e.target.value)})}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    描述 (可选)
                  </label>
                  <Textarea
                    value={newReward.description}
                    onChange={e => setNewReward({...newReward, description: e.target.value})}
                    placeholder="奖励的详细描述..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  取消
                </Button>
                <Button onClick={handleAddReward}>
                  创建
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="available">
        <TabsList className="mb-6">
          <TabsTrigger value="available">可兑换奖励</TabsTrigger>
          <TabsTrigger value="redeemed">已兑换奖励</TabsTrigger>
        </TabsList>
        
        <TabsContent value="available">
          {availableRewards.length === 0 && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedGroup === "all" ? "还没有可兑换奖励" : 
                   selectedGroup === "global" ? "公共池下没有可兑换奖励" :
                   "该分组下没有可兑换奖励"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">点击"添加奖励"按钮创建你的第一个奖励。</p>
                <Button onClick={() => setIsAddDialogOpen(true)}>添加奖励</Button>
              </CardContent>
            </Card>
          )}

          {availableRewards.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableRewards.map(reward => {
                const group = reward.groupId ? getGroupById(reward.groupId) : null;
                let groupEnergy = 0;
                let canRedeem = false;
                
                if (reward.groupId === null) {
                  // 公共池奖励：使用所有能量总和
                  groupEnergy = getTotalEnergy();
                  canRedeem = groupEnergy >= reward.energyCost;
                } else {
                  // 分组奖励：只使用对应分组能量
                  groupEnergy = getGroupEnergy(reward.groupId);
                  canRedeem = groupEnergy >= reward.energyCost;
                }
                
                return (
                  <Card key={reward.id} className="relative">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">{reward.name}</CardTitle>
                        <span className="energy-badge bg-habit-softyellow text-habit-orange">
                          {reward.energyCost} 能量
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {reward.description && (
                        <p className="text-sm mb-3">{reward.description}</p>
                      )}
                      
                      <p className="text-sm text-muted-foreground mb-3">
                        分组: {group?.name || "公共池"}
                        {reward.groupId === null && (
                          <span className="text-xs text-blue-600 block">（可用所有能量兑换）</span>
                        )}
                      </p>
                      
                      <div className="mb-4">
                        <ProgressBar current={groupEnergy} max={reward.energyCost} />
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          className="flex-1"
                          disabled={!canRedeem}
                          onClick={() => handleRedeemReward(reward.id)}
                        >
                          {canRedeem ? "兑换奖励" : "能量不足"}
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => openEditDialog(reward)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-edit"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="icon">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>确认删除奖励</AlertDialogTitle>
                              <AlertDialogDescription>
                                确定要删除奖励 "{reward.name}" 吗？此操作不可撤销。
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>取消</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteReward(reward.id)}>
                                确认删除
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="redeemed">
          {redeemedRewards.length === 0 && (
            <Card>
              <CardHeader>
                <CardTitle>还没有已兑换的奖励</CardTitle>
              </CardHeader>
              <CardContent>
                <p>完成习惯，积累能量并兑换奖励。</p>
              </CardContent>
            </Card>
          )}

          {redeemedRewards.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {redeemedRewards.map(reward => {
                const group = reward.groupId ? getGroupById(reward.groupId) : null;
                const redeemedDate = reward.redeemedTimestamp ? 
                  new Date(reward.redeemedTimestamp).toLocaleDateString() : 
                  "未知日期";
                
                return (
                  <Card key={reward.id} className="relative bg-muted/20">
                    <div className="absolute top-2 right-2 bg-habit-green text-white text-xs px-2 py-1 rounded">
                      已兑换
                    </div>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{reward.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {reward.description && (
                        <p className="text-sm mb-3">{reward.description}</p>
                      )}
                      
                      <p className="text-sm text-muted-foreground">
                        分组: {group?.name || "公共池"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        兑换消耗: {reward.energyCost} 能量
                      </p>
                      <p className="text-sm text-muted-foreground">
                        兑换日期: {redeemedDate}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑奖励</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">
                奖励名称
              </label>
              <Input
                value={editReward.name}
                onChange={e => setEditReward({...editReward, name: e.target.value})}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">
                所属分组
              </label>
              <Select 
                value={editReward.groupId || ""} 
                onValueChange={value => setEditReward({...editReward, groupId: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择分组" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">公共池（可用所有能量兑换）</SelectItem>
                  {state.groups.map(group => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">
                所需能量值
              </label>
              <Input
                type="number"
                min="1"
                value={editReward.energyCost}
                onChange={e => setEditReward({...editReward, energyCost: parseInt(e.target.value)})}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">
                描述 (可选)
              </label>
              <Textarea
                value={editReward.description}
                onChange={e => setEditReward({...editReward, description: e.target.value})}
                placeholder="奖励的详细描述..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleEditReward}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Rewards;
