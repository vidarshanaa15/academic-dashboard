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