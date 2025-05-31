
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md p-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 text-habit-purple">404</h1>
          <p className="text-xl text-muted-foreground mb-6">页面不存在</p>
          <Button onClick={() => window.location.href = '/'}>
            返回首页
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default NotFound;
