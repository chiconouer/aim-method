export function isModuleUnlocked(
  moduleId: number,
  completedModules: number[],
): boolean {
  if (moduleId === 1) return true;
  return completedModules.includes(moduleId - 1);
}
