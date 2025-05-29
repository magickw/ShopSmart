import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart, Coffee } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function DonationButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState("5.00");
  const { toast } = useToast();
  
  const handleDonate = () => {
    // In a production app, we would redirect to a payment processor here
    toast({
      title: "Thank you!",
      description: `Your $${selectedAmount} donation is greatly appreciated.`,
    });
    setIsOpen(false);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full flex items-center justify-center gap-2 mt-3 mb-1 bg-white border border-primary border-opacity-30 text-primary"
        >
          <Heart className="h-4 w-4" />
          <span>Support This App</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Support ShopSmart</DialogTitle>
          <DialogDescription>
            Your donation helps keep this app free for everyone. Thank you for your support!
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex justify-center">
            <div className="bg-primary/10 p-6 rounded-full">
              <Coffee className="h-12 w-12 text-primary" />
            </div>
          </div>
          
          <RadioGroup 
            value={selectedAmount} 
            onValueChange={setSelectedAmount}
            className="grid grid-cols-3 gap-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="3.00" id="amount-1" />
              <Label htmlFor="amount-1" className="cursor-pointer">$3</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="5.00" id="amount-2" />
              <Label htmlFor="amount-2" className="cursor-pointer">$5</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="10.00" id="amount-3" />
              <Label htmlFor="amount-3" className="cursor-pointer">$10</Label>
            </div>
          </RadioGroup>
          
          <Button 
            onClick={handleDonate} 
            className="w-full"
          >
            Donate ${selectedAmount}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}