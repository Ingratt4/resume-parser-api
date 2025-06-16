import pdf from "pdf-parse";
import fs from "fs";
import nlp from "compromise";
import nlpDates from "compromise-dates";

nlp.extend(nlpDates);

type EducationEntry = {
  school: string;
  degree?: string;
  major?: string;
  graduationDate?: string;
};

interface Resume {
  name: string | null;
  phone: string | null;
  email: string | null;
  education: EducationEntry[];
  experience: number | null;
  skills: string[];
  projects: string[];
}

export async function parseResume(
  resume: Express.Multer.File
): Promise<Resume> {
  const parsedResume: Resume = {
    name: await parseName(resume),
    phone: await parsePhone(resume),
    email: await parseEmail(resume),
    education: await parseEducation(resume),
    experience: await parseExperience(resume),
    skills: parseSkills(resume),
    projects: parseProjects(resume),
  };

  return parsedResume;
}

async function parseName(resume: Express.Multer.File): Promise<string | null> {
  // do stuff
  const dataBuffer = fs.readFileSync(resume.path);

  const data = await pdf(dataBuffer);
  const text = data.text;
  let name = nlp(text).people().out("array");

  return name[0];
}
async function parseEducation(
  resume: Express.Multer.File
): Promise<EducationEntry[]> {
  const educationRegex =
    /Education\s*\n([\s\S]*?)(?=\b(?:Experience|Projects|Education|Technical Skills|Skills|Certifications|Summary)\b|$)/i;

  const dataBuffer = fs.readFileSync(resume.path);
  const data = await pdf(dataBuffer);
  const text = data.text.replace(/\r\n/g, "\n");

  const match = text.match(educationRegex);
  const educationSection = match?.[1];

  console.log("Matched Education Text:", educationSection || "No match");

  if (!educationSection) return [];

  // Fallback regex to extract school name (more constrained)
  const schoolMatch = educationSection.match(
    /(University|College|Institute|School)\s(?:of\s)?[A-Z][a-z]+(?:\s[A-Z][a-z]+)?/g
  );
  const degreeMatch = educationSection.match(
    /\b(Bachelor|Master|Ph\.?D\.?|B\.Sc\.|M\.Sc\.|BA|MA)[^,\n]*/i
  );
  const degree = degreeMatch?.[0].trim();
  const majorMatch = educationSection.match(/in\s([A-Z][a-zA-Z\s&]+)/i);
  const major = majorMatch?.[1].trim();
  const gradMatch = educationSection.match(
    /\b(Fall|Winter|Spring|Summer)?\s?(20\d{2})\b/i
  );
  const graduationDate = gradMatch ? gradMatch[0].trim() : undefined;

  console.log("Extracted School Name(s):", schoolMatch);

  if (schoolMatch && schoolMatch.length > 0) {
    const cleanedSchool = schoolMatch[0].replace(/([A-Za-z]+)\1/, "$1").trim();
    return [
      {
        school: cleanedSchool,
        degree,
        major,
        graduationDate,
      },
    ];
  }

  return [];
}

async function parsePhone(resume: Express.Multer.File): Promise<string | null> {
  const phoneRegex = /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/;

  const dataBuffer = fs.readFileSync(resume.path);

  const data = await pdf(dataBuffer);
  const text = data.text;
  const match = text.match(phoneRegex);

  return match ? match[0] : null;
}

async function parseEmail(resume: Express.Multer.File): Promise<string | null> {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const dataBuffer = fs.readFileSync(resume.path);

  const data = await pdf(dataBuffer);
  const text = data.text;

  const match = text.match(emailRegex);

  return match ? match[0] : null;
}

export async function parseExperience(
  resume: Express.Multer.File
): Promise<number | null> {
  // Regex to isolate text between 'Experience' and the next heading
  const experienceRegex =
    /Experience\s*\n([\s\S]*?)(?=\n(?:Projects|Education|Technical Skills|Skills|Certifications|Summary)|$)/i;

  const dataBuffer = fs.readFileSync(resume.path);
  const data = await pdf(dataBuffer);
  const text = data.text.replace(/\r\n/g, "\n");
  let exp = 0;

  const match = text.match(experienceRegex);

  if (match) {
    const doc = nlp(match[0]) as any;
    const dates = doc.dates().json();

    console.log("Extracted Dates:", dates);

    dates.forEach((date: any) => {
      try {
        const start = new Date(date.dates.start).getTime();
        const end = new Date(date.dates.end).getTime();
        exp += end - start;
      } catch (err) {
        console.warn("Invalid date object:", date);
      }
    });

    const msInMonth = 1000 * 60 * 60 * 24 * 30;
    const months = exp / msInMonth;
    const years = months / 12;
    console.log(`Estimated experience duration: ~${months.toFixed(1)} months`);
    return Math.round(years);
  }
  return 0;
}

function parseSkills(resume: Express.Multer.File): string[] {
  const skills = ["empty"];
  return skills;
}
function parseProjects(resume: Express.Multer.File): string[] {
  const projects = ["empty"];
  return projects;
}

export default parseResume;
