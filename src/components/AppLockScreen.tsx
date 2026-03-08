import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Lock, Delete, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface AppLockScreenProps {
  onUnlock: () => void;
}

const AppLockScreen = ({ onUnlock }: AppLockScreenProps) => {
  const { profile } = useAuth();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [showPin, setShowPin] = useState(false);

  const storedPin = profile?.app_lock_pin;

  useEffect(() => {
    if (pin.length === 4 && storedPin) {
      if (pin === storedPin) {
        onUnlock();
      } else {
        setError(true);
        setTimeout(() => {
          setPin("");
          setError(false);
        }, 600);
      }
    }
  }, [pin, storedPin, onUnlock]);

  const addDigit = (digit: string) => {
    if (pin.length < 4) setPin(prev => prev + digit);
  };

  const removeDigit = () => {
    setPin(prev => prev.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-8 w-full max-w-xs px-4"
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-display text-xl font-bold text-foreground">Cerebralta</h1>
          <p className="text-sm text-muted-foreground">Digite seu PIN para desbloquear</p>
        </div>

        {/* PIN dots */}
        <motion.div
          animate={error ? { x: [0, -10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="flex gap-4"
        >
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all duration-200 ${
                i < pin.length
                  ? error ? "bg-destructive scale-110" : "bg-primary scale-110"
                  : "bg-border"
              }`}
            />
          ))}
        </motion.div>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-destructive font-medium"
          >
            PIN incorreto. Tente novamente.
          </motion.p>
        )}

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-3 w-full">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map(d => (
            <button
              key={d}
              onClick={() => addDigit(d)}
              className="h-14 rounded-xl bg-muted text-foreground text-xl font-semibold hover:bg-muted/80 active:scale-95 transition-all"
            >
              {d}
            </button>
          ))}
          <button
            onClick={() => setShowPin(!showPin)}
            className="h-14 rounded-xl bg-muted text-muted-foreground hover:bg-muted/80 active:scale-95 transition-all flex items-center justify-center"
          >
            {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
          <button
            onClick={() => addDigit("0")}
            className="h-14 rounded-xl bg-muted text-foreground text-xl font-semibold hover:bg-muted/80 active:scale-95 transition-all"
          >
            0
          </button>
          <button
            onClick={removeDigit}
            className="h-14 rounded-xl bg-muted text-muted-foreground hover:bg-muted/80 active:scale-95 transition-all flex items-center justify-center"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {showPin && pin.length > 0 && (
          <p className="text-sm text-muted-foreground font-mono tracking-widest">{pin}</p>
        )}
      </motion.div>
    </div>
  );
};

export default AppLockScreen;
