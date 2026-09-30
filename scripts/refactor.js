const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Replace import
  if (content.includes("import { useRobotStore } from '@/lib/robotState';")) {
    const imports = [];
    if (content.match(/\b(position|orientation|arm|tracks|electromagnet|torch|trackOffset|fifthCableLength|locomotionIntent|setArmPosition|setElectromagnet|setTorch|setLocomotionIntent)\b/)) {
      imports.push("import { useTelemetryStore } from '@/lib/state/telemetryStore';");
    }
    if (content.match(/\b(simulationState|activeCutPath|completedCuts|setSimulationState|addCutPoint|completeCut|discardActiveCut|clearAllCuts|CutRecord)\b/)) {
      imports.push("import { useMissionStore, CutRecord } from '@/lib/state/missionStore';");
    }
    if (content.match(/\b(uiMode|xRayMode|followMode|cameraTarget|cameraFocusTrigger|setUiMode|setXRayMode|setFollowMode|triggerCameraFocus)\b/)) {
      imports.push("import { useUIStore } from '@/lib/state/uiStore';");
    }
    
    // Remove the old import and add new ones
    content = content.replace("import { useRobotStore } from '@/lib/robotState';", imports.join('\n'));
    // If CutRecord was separately imported, remove it
    content = content.replace("import type { CutRecord } from '@/lib/robotState';\n", "");
  }

  // Common replacements for direct store calls
  content = content.replace(/useRobotStore\(\(state\) => state\.torch\.enabled\)/g, "useTelemetryStore((state) => state.torch.enabled)");
  content = content.replace(/useRobotStore\(state => state\.trackOffset\)/g, "useTelemetryStore(state => state.trackOffset)");
  content = content.replace(/useRobotStore\(state => state\.xRayMode\)/g, "useUIStore(state => state.xRayMode)");
  content = content.replace(/useRobotStore\(state => state\.activeCutPath\)/g, "useMissionStore(state => state.activeCutPath)");
  content = content.replace(/useRobotStore\(state => state\.completedCuts\)/g, "useMissionStore(state => state.completedCuts)");
  content = content.replace(/useRobotStore\(\(state\) => state\.arm\.xExtension\)/g, "useTelemetryStore((state) => state.arm.xExtension)");
  content = content.replace(/useRobotStore\(\(state\) => state\.position\)/g, "useTelemetryStore((state) => state.position)");
  content = content.replace(/useRobotStore\(state => state\.position\)/g, "useTelemetryStore(state => state.position)");
  content = content.replace(/useRobotStore\(\(state\) => state\.uiMode\)/g, "useUIStore((state) => state.uiMode)");
  content = content.replace(/useRobotStore\(\(state\) => state\.arm\)/g, "useTelemetryStore((state) => state.arm)");
  content = content.replace(/useRobotStore\(\(state\) => state\.electromagnet\.enabled\)/g, "useTelemetryStore((state) => state.electromagnet.enabled)");
  content = content.replace(/useRobotStore\(state => state\.cameraTarget\)/g, "useUIStore(state => state.cameraTarget)");
  content = content.replace(/useRobotStore\(state => state\.followMode\)/g, "useUIStore(state => state.followMode)");
  content = content.replace(/useRobotStore\(state => state\.cameraFocusTrigger\)/g, "useUIStore(state => state.cameraFocusTrigger)");

  // Destructuring replacements
  content = content.replace(/const { position } = useRobotStore\(\);/g, "const { position } = useTelemetryStore();");
  content = content.replace(/const { position, arm } = useRobotStore\(\);/g, "const { position, arm } = useTelemetryStore();");
  content = content.replace(/const { yPosition, xExtension } = useRobotStore\(\(state\) => state\.arm\);/g, "const { yPosition, xExtension } = useTelemetryStore((state) => state.arm);");

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated', filePath);
  }
}

const walk = (dir, callback) => {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    if (fs.statSync(dirPath).isDirectory()) {
      walk(dirPath, callback);
    } else {
      callback(dirPath);
    }
  });
};

walk('src/components', (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    if (filePath.includes('ControlPanel') || filePath.includes('SimulationController')) return; // Will handle manually
    replaceInFile(filePath);
  }
});
