export function averageGradeLabel(grades: string[]): string | null {
  if (!grades || grades.length === 0) return null;

  const gradeMap: Record<string, number> = {
    'A': 4.0,
    'B+': 3.5,
    'B': 3.0,
    'C+': 2.5,
    'C': 2.0,
    'D+': 1.5,
    'D': 1.0,
    'F': 0.0
  };

  let total = 0;
  let count = 0;

  for (const g of grades) {
    if (gradeMap[g] !== undefined) {
      total += gradeMap[g];
      count++;
    }
  }

  if (count === 0) return null;
  
  const avg = total / count;
  
  // Convert back to closest grade string or just return GPA string
  return avg.toFixed(2);
}
