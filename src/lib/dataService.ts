import { supabase } from './supabase';
import { Semester, Goal } from '../data/sampleData';

export const fetchAcademicData = async () => {
  // Fetch semesters and their nested subjects in one clean join
  const { data: semesters, error: semError } = await supabase
    .from('semesters')
    .select(`
      *,
      subjects (*)
    `)
    .order('year', { ascending: true });

  const { data: goals, error: goalError } = await supabase
    .from('goals')
    .select('*');

  if (semError) throw semError;
  if (goalError) throw goalError;

  return {
    semesters: (semesters as any[]) || [],
    goals: (goals as Goal[]) || []
  };
};

// --- Semester ---

export const saveSemester = async (
  semester: Omit<Semester, 'subjects' | 'gpa' | 'cgpa'>,
  subjects: { id: string; name: string; credits: number; grade: string | null; tag: string }[]
) => {
  // 1. Insert semester row (gpa/cgpa will be computed by trigger after subjects insert)
  const { error: semError } = await supabase.from('semesters').insert([{
    id: semester.id,
    name: semester.name,
    year: semester.year,
    term: semester.term,
    status: semester.status,
    gpa: null,
    cgpa: null,
  }]);
  if (semError) throw semError;

  // 2. Insert all subjects — trigger fires and computes GPA automatically
  if (subjects.length > 0) {
    const { error: subError } = await supabase.from('subjects').insert(
      subjects.map(s => ({ ...s, semester_id: semester.id }))
    );
    if (subError) throw subError;
  }

  // 3. Re-fetch the semester with computed GPA/CGPA from DB
  const { data, error: fetchError } = await supabase
    .from('semesters')
    .select(`*, subjects (*)`)
    .eq('id', semester.id)
    .single();
  if (fetchError) throw fetchError;

  return data as Semester;
};

export const updateSemesterStatus = async (id: string, status: 'planned' | 'completed') => {
  const { error } = await supabase.from('semesters').update({ status }).eq('id', id);
  if (error) throw error;
};

// --- Subject grade editing ---

export const updateSubjectGrade = async (
  subjectId: string,
  grade: string,
) => {
  const { error } = await supabase
    .from('subjects')
    .update({ grade })
    .eq('id', subjectId);
  if (error) throw error;
  // Trigger fires automatically and recomputes GPA/CGPA on the DB side
};

// Fetch a single semester with fresh GPA/CGPA after edits
export const refetchSemester = async (semesterId: string): Promise<Semester> => {
  const { data, error } = await supabase
    .from('semesters')
    .select(`*, subjects (*)`)
    .eq('id', semesterId)
    .single();
  if (error) throw error;
  return data as Semester;
};

export const toggleGoalStatus = async (id: string, completed: boolean) => {
  const { error } = await supabase
    .from('goals')
    .update({ completed })
    .eq('id', id);
  if (error) throw error;
};

export const deleteGoalFromDb = async (id: string) => {
  const { error } = await supabase.from('goals').delete().eq('id', id);
  if (error) throw error;
};

export const addGoalToDb = async (goal: any) => {
  const { data, error } = await supabase.from('goals').insert([goal]).select();
  if (error) throw error;
  return data[0];
};

export const deleteSubjectFromDb = async (subjectId: string) => {
  const { error } = await supabase.from('subjects').delete().eq('id', subjectId);
  if (error) throw error;
};

export const deleteSemesterFromDb = async (semesterId: string) => {
  // Subjects are deleted automatically via ON DELETE CASCADE
  const { error } = await supabase.from('semesters').delete().eq('id', semesterId);
  if (error) throw error;
};