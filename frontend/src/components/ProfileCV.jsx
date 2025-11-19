import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Plus, Trash2, Github, Linkedin, Twitter, Globe, MapPin, Briefcase, GraduationCap } from 'lucide-react';

export function ExperienceSection({ experience, setExperience }) {
  const addExperience = () => {
    setExperience([...experience, {
      title: '',
      company: '',
      start_date: '',
      end_date: '',
      current: false,
      description: ''
    }]);
  };

  const updateExperience = (index, field, value) => {
    const updated = [...experience];
    updated[index][field] = value;
    setExperience(updated);
  };

  const removeExperience = (index) => {
    setExperience(experience.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-purple-400" />
          Experience
        </h3>
        <Button onClick={addExperience} size="sm" variant="outline" className="border-purple-600 text-purple-400">
          <Plus className="w-4 h-4 mr-1" /> Add
        </Button>
      </div>

      {experience.map((exp, index) => (
        <Card key={index} className="p-4 bg-gray-800/50 border-gray-700">
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  placeholder="Job Title"
                  value={exp.title}
                  onChange={(e) => updateExperience(index, 'title', e.target.value)}
                  className="bg-gray-900 border-gray-700 text-white"
                />
                <Input
                  placeholder="Company"
                  value={exp.company}
                  onChange={(e) => updateExperience(index, 'company', e.target.value)}
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>
              <Button
                onClick={() => removeExperience(index)}
                size="sm"
                variant="ghost"
                className="text-red-400 hover:text-red-300 hover:bg-red-900/20 ml-2"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                type="month"
                placeholder="Start Date"
                value={exp.start_date}
                onChange={(e) => updateExperience(index, 'start_date', e.target.value)}
                className="bg-gray-900 border-gray-700 text-white"
              />
              <Input
                type="month"
                placeholder="End Date"
                value={exp.end_date}
                onChange={(e) => updateExperience(index, 'end_date', e.target.value)}
                disabled={exp.current}
                className="bg-gray-900 border-gray-700 text-white disabled:opacity-50"
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-400">
              <input
                type="checkbox"
                checked={exp.current}
                onChange={(e) => updateExperience(index, 'current', e.target.checked)}
                className="rounded border-gray-700"
              />
              Currently working here
            </label>

            <Textarea
              placeholder="Description of responsibilities and achievements"
              value={exp.description}
              onChange={(e) => updateExperience(index, 'description', e.target.value)}
              className="bg-gray-900 border-gray-700 text-white min-h-[80px]"
            />
          </div>
        </Card>
      ))}
    </div>
  );
}

export function EducationSection({ education, setEducation }) {
  const addEducation = () => {
    setEducation([...education, {
      degree: '',
      institution: '',
      year: '',
      description: ''
    }]);
  };

  const updateEducation = (index, field, value) => {
    const updated = [...education];
    updated[index][field] = value;
    setEducation(updated);
  };

  const removeEducation = (index) => {
    setEducation(education.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-blue-400" />
          Education
        </h3>
        <Button onClick={addEducation} size="sm" variant="outline" className="border-blue-600 text-blue-400">
          <Plus className="w-4 h-4 mr-1" /> Add
        </Button>
      </div>

      {education.map((edu, index) => (
        <Card key={index} className="p-4 bg-gray-800/50 border-gray-700">
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  placeholder="Degree / Qualification"
                  value={edu.degree}
                  onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                  className="bg-gray-900 border-gray-700 text-white"
                />
                <Input
                  placeholder="Institution / University"
                  value={edu.institution}
                  onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>
              <Button
                onClick={() => removeEducation(index)}
                size="sm"
                variant="ghost"
                className="text-red-400 hover:text-red-300 hover:bg-red-900/20 ml-2"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <Input
              placeholder="Year (e.g., 2020-2024)"
              value={edu.year}
              onChange={(e) => updateEducation(index, 'year', e.target.value)}
              className="bg-gray-900 border-gray-700 text-white"
            />

            <Textarea
              placeholder="Description, achievements, relevant coursework..."
              value={edu.description}
              onChange={(e) => updateEducation(index, 'description', e.target.value)}
              className="bg-gray-900 border-gray-700 text-white min-h-[60px]"
            />
          </div>
        </Card>
      ))}
    </div>
  );
}

export function SkillsSection({ skills, setSkills }) {
  const [newSkill, setNewSkill] = useState('');

  const addSkill = () => {
    if (newSkill.trim()) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const removeSkill = (index) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Skills</h3>
      
      <div className="flex gap-2">
        <Input
          placeholder="Add a skill (e.g., React, Python, UI/UX)"
          value={newSkill}
          onChange={(e) => setNewSkill(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addSkill()}
          className="bg-gray-900 border-gray-700 text-white"
        />
        <Button onClick={addSkill} size="sm" className="bg-green-600 hover:bg-green-700">
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {skills.map((skill, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1 px-3 py-1 bg-purple-600/20 border border-purple-600/30 rounded-full text-sm text-purple-300"
          >
            {skill}
            <button
              onClick={() => removeSkill(index)}
              className="ml-1 hover:text-red-400"
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

export function SocialLinksSection({ formData, handleChange }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Social Links</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
            <Github className="w-4 h-4" /> GitHub
          </label>
          <Input
            name="github_link"
            placeholder="https://github.com/username"
            value={formData.github_link || ''}
            onChange={handleChange}
            className="bg-gray-900 border-gray-700 text-white"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
            <Linkedin className="w-4 h-4" /> LinkedIn
          </label>
          <Input
            name="linkedin_link"
            placeholder="https://linkedin.com/in/username"
            value={formData.linkedin_link || ''}
            onChange={handleChange}
            className="bg-gray-900 border-gray-700 text-white"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
            <Twitter className="w-4 h-4" /> Twitter
          </label>
          <Input
            name="twitter_link"
            placeholder="https://twitter.com/username"
            value={formData.twitter_link || ''}
            onChange={handleChange}
            className="bg-gray-900 border-gray-700 text-white"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
            <Globe className="w-4 h-4" /> Portfolio Website
          </label>
          <Input
            name="portfolio_link"
            placeholder="https://yourwebsite.com"
            value={formData.portfolio_link || ''}
            onChange={handleChange}
            className="bg-gray-900 border-gray-700 text-white"
          />
        </div>
      </div>
    </div>
  );
}
