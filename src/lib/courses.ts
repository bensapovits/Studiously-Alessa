import { supabase } from './supabase';
import Anthropic from '@anthropic-ai/sdk';
import { extractTextFromPdf } from './pdf';

export interface Course {
  id: string;
  name: string;
  color: string;
  user_id: string;
  created_at: string;
}

export interface Assignment {
  id: string;
  title: string;
  due_date: string;
  course_id: string;
  user_id: string;
  created_at: string;
  course?: {
    name: string;
    color: string;
  };
}

const anthropic = new Anthropic({
  apiKey: import.meta.env.VITE_CLAUDE_API_KEY
});

export async function createCourse(course: Omit<Course, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('courses')
    .insert([course])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getCourses() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('user_id', user.id)
    .order('name');

  if (error) throw error;
  return data;
}

export async function createAssignment(assignment: Omit<Assignment, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('assignments')
    .insert([assignment])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getAssignments(startDate: Date, endDate: Date) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('assignments')
    .select(`
      *,
      course:courses(name, color)
    `)
    .eq('user_id', user.id)
    .gte('due_date', startDate.toISOString())
    .lte('due_date', endDate.toISOString())
    .order('due_date');

  if (error) throw error;
  return data;
}

export async function parseSyllabus(file: File): Promise<{ name: string; assignments: { title: string; dueDate: string }[] }> {
  if (!file || file.type !== 'application/pdf') {
    throw new Error('Please upload a PDF file');
  }

  if (!import.meta.env.VITE_CLAUDE_API_KEY) {
    throw new Error('Claude API key is not configured');
  }

  try {
    // Extract text from PDF
    const pdfText = await extractTextFromPdf(file);
    
    if (!pdfText.trim()) {
      throw new Error('No text content found in PDF');
    }

    // Send to Claude API
    const message = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 4096,
      temperature: 0,
      messages: [{
        role: 'user',
        content: `Extract the course name and assignment details from this syllabus. Return ONLY a JSON object with this exact format:
{
  "name": "Course Name",
  "assignments": [
    {
      "title": "Assignment Title",
      "dueDate": "YYYY-MM-DD"
    }
  ]
}

Rules:
1. The course name should be the main course title from the syllabus
2. Only include assignments with specific due dates
3. Convert all dates to YYYY-MM-DD format
4. Skip readings without due dates
5. Include homework, projects, papers, and exams

Here's the syllabus text:

${pdfText}`
      }]
    });

    if (!message.content[0]?.text) {
      throw new Error('No response received from Claude');
    }

    // Extract JSON from response
    const jsonMatch = message.content[0].text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from Claude');
    }

    const result = JSON.parse(jsonMatch[0]);

    // Validate response structure
    if (!result || typeof result.name !== 'string' || !Array.isArray(result.assignments)) {
      throw new Error('Invalid response format: Missing required fields');
    }

    if (!result.name.trim()) {
      throw new Error('Invalid response: Course name is empty');
    }

    // Validate assignments
    result.assignments = result.assignments.filter(assignment => {
      if (!assignment || typeof assignment !== 'object') return false;
      
      const hasValidTitle = typeof assignment.title === 'string' && assignment.title.trim() !== '';
      const hasValidDate = typeof assignment.dueDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(assignment.dueDate);
      
      if (!hasValidTitle || !hasValidDate) {
        console.warn('Invalid assignment:', assignment);
        return false;
      }
      
      return true;
    });

    if (result.assignments.length === 0) {
      throw new Error('No valid assignments found in syllabus');
    }

    return result;
  } catch (error) {
    console.error('Error parsing syllabus:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to parse syllabus: ${error.message}`);
    }
    throw new Error('Failed to parse syllabus');
  }
}