import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';

const UserInfo = () => {
    const { user } = useAuth();
    const email = user?.email || '';
    
    // 3D rotation animation
    const flipAnimation = {
      rotateY: [0, 360],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "linear",
        repeatDelay: 5
      }
    };
  
    return (
      <div className="flex items-center space-x-2">
        <motion.div 
          className="flex items-center bg-white/10 rounded-full py-1 px-2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          style={{ perspective: 1000 }}
        >
          <motion.div 
            className="w-7 h-7 bg-white rounded-full flex items-center justify-center"
            animate={flipAnimation}
            style={{ transformStyle: "preserve-3d" }}
          >
            <span className="text-blue-500 font-semibold">
              {email[0]?.toUpperCase()}
            </span>
          </motion.div>
          <span className="text-white text-sm ml-2 hidden md:block">
            {email}
          </span>
        </motion.div>
      </div>
    );
  };

export default UserInfo;
