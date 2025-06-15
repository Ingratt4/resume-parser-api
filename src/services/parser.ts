import pdf from "pdf-parse";
import fs from "fs";
import nlp from "compromise";
import nlpDates from "compromise-dates";

nlp.extend(nlpDates);

interface Resume {
  name: string | null;
  phone: string | null;
  email: string | null;
  education: string;
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
    education: parseEducation(resume),
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
function parseEducation(resume: Express.Multer.File): string {
  const education = "";
  // do stuff
  return education;
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
