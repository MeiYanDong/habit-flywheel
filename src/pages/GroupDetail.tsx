
import { useParams, useNavigate } from "react-router-dom";
import { useAppState } from "@/contexts/AppStateContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Trash2 } from "lucide-react";

const GroupDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    state, 
    getGroupById, 
    getHabitsByGroupId, 
    getRewardsByGroupId, 
    getGroupEnergy,
    deleteHabit,
    deleteReward
  } = useAppState();

  if (!id) {
    return <div>Group not found</div>;
  }

  const group = getGroupById(id);
  const habits = getHabitsByGroupId(id);
  const rewards = getRewardsByGroupId(id);
  const energy = getGroupEnergy(id);

  if (!group) {
    return <div>Group not found</div>;
  }

  return (
    <div className="container mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">{group.name}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>当前能量</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-habit-purple">{energy}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>习惯数量</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{habits.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>奖励数量</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{rewards.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-semibold mb-4">习惯</h2>
          {habits.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">此分组暂无习惯</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {habits.map(habit => (
                <Card key={habit.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{habit.name}</CardTitle>
                        <CardDescription>{habit.frequency.description}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => deleteHabit(habit.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      能量值: +{habit.energyValue}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">奖励</h2>
          {rewards.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">此分组暂无奖励</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {rewards.map(reward => (
                <Card key={reward.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{reward.name}</CardTitle>
                        {reward.description && (
                          <CardDescription>{reward.description}</CardDescription>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => deleteReward(reward.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      消耗能量: {reward.energyCost}
                    </p>
                    {reward.redeemed && (
                      <p className="text-xs text-green-600 mt-1">已兑换</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupDetail;
