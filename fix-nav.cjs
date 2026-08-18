const fs = require('fs');
let c = fs.readFileSync('src/components/Navigation.tsx', 'utf8');
c = c.replace(/import \{[\s\S]*?\} from 'lucide-react';/, "import { Users, Trophy, Calendar, MoreVertical, PlaySquare, Shuffle, Printer, Download, Upload, Trash2, Sparkles } from 'lucide-react';");
fs.writeFileSync('src/components/Navigation.tsx', c);
