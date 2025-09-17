import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

const steps = [
  'Upload Resume',
  'Candidate Details',
  'Education',
  'Experience',
];



const ResumeModal = ({ isOpen, onClose, user }) => {
  // Chips input logic for other fields (must be inside component)
  const [sectorInput, setSectorInput] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [languageInput, setLanguageInput] = useState("");
  const [editedStep, setEditedStep] = useState({});
  const [step, setStep] = useState(0);
  const [skillInput, setSkillInput] = useState("");
  const [saved, setSaved] = useState(false);
  const [scanning, setScanning] = useState(false);
  // Move form earlier so effects can reference it safely
  const [form, setForm] = useState({
    name: 'AK Deepankar',
    fatherName: '',
    category: '',
    disabilityStatus: 'Not Disabled',
    educationList: [
      {
        educationLevel: '',
        course: '',
        board_university_name: '',
        institute_name: '',
        year_of_passing: '',
        marks_or_grade: '',
        certificate_file_path: null,
      }
    ],
    experienceList: [
      {
        type: '',
        years: '',
        details: '',
      }
    ],
    education: '',
    major: '',
    experience: '0',
    skills: [],
    sectors: [],
    preferredLocations: [],
    remoteOk: false,
    preferredLanguage: '',
    languagesKnown: [],
    mobile: '',
    altMobile: '',
    email: 'akdeepaknyc@gmail.com',
    address1: '',
    address2: '',
    state: '',
    district: '',
    pincode: '',
    resumeFile: null,
  });
  const [allSkills, setAllSkills] = useState([]); // from skills.csv
  const [skillSuggestions, setSkillSuggestions] = useState([]);
  // Colleges / Universities suggestion data
  const [allColleges, setAllColleges] = useState([]);
  const [boardSuggestionsMap, setBoardSuggestionsMap] = useState({}); // idx -> list
  const [instituteSuggestionsMap, setInstituteSuggestionsMap] = useState({});
  // Courses suggestion data
  const [allCourses, setAllCourses] = useState([]);
  const [courseSuggestionsMap, setCourseSuggestionsMap] = useState({});

  const fillFormFromOCR = (ocr) => {
    if (!ocr || !ocr.applicant) return;
    setForm(prev => ({
      ...prev,
      name: ocr.applicant["name"] || prev.name,
      fatherName: ocr.applicant["father name"] || prev.fatherName,
      category: ocr.applicant["category"] || prev.category,
      disabilityStatus: ocr.applicant["disability status"] || prev.disabilityStatus,
      education: ocr.applicant["education level"] || prev.education,
      major: ocr.applicant["major"] || prev.major,
      experience: ocr.applicant["experience years"] || prev.experience,
      skills: ocr.applicant["skills"]
        ? ocr.applicant["skills"].split(',').map(s => s.trim()).filter(Boolean)
        : prev.skills,
      sectors: ocr.applicant["sectors of interest"]
        ? ocr.applicant["sectors of interest"].split(',').map(s => s.trim()).filter(Boolean)
        : prev.sectors,
      preferredLocations: ocr.applicant["preferred locations"]
        ? ocr.applicant["preferred locations"].split(',').map(s => s.trim()).filter(Boolean)
        : prev.preferredLocations,
      remoteOk: ocr.applicant["remote ok"] === 'true' || ocr.applicant["remote ok"] === true,
      preferredLanguage: ocr.applicant["preferred language"] || prev.preferredLanguage,
      languagesKnown: ocr.applicant["languages known"]
        ? ocr.applicant["languages known"].split(',').map(s => s.trim()).filter(Boolean)
        : prev.languagesKnown,
      mobile: ocr.applicant["mobile number"] || prev.mobile,
      altMobile: ocr.applicant["alt mobile number"] || prev.altMobile,
      email: ocr.applicant["email"] || prev.email,
      address1: ocr.applicant["address line1"] || prev.address1,
      address2: ocr.applicant["address line2"] || prev.address2,
      state: ocr.applicant["state"] || prev.state,
      district: ocr.applicant["district"] || prev.district,
      pincode: ocr.applicant["pincode"] || prev.pincode,
      educationList: Array.isArray(ocr.education) && ocr.education.length > 0
        ? ocr.education.map(e => ({
            educationLevel: e["level"] || '',
            course: e["course"] || '',
            board_university_name: e["board university name"] || '',
            institute_name: e["institute name"] || '',
            year_of_passing: e["year of passing"] || '',
            marks_or_grade: e["marks or grade"] || '',
            certificate_file_path: null,
            major: e["major"] || '',
          }))
        : prev.educationList,
      experienceList: Array.isArray(ocr.experience) && ocr.experience.length > 0
        ? ocr.experience.map(e => ({
            type: e["type"] || '',
            years: e["years"] || '',
            details: e["details"] || '',
          }))
        : prev.experienceList,
    }));
  };

  // Load skills list when modal opens first time
  React.useEffect(() => {
    if (isOpen && allSkills.length === 0) {
      fetch('/skills.csv')
        .then(r => r.text())
        .then(txt => {
          const lines = txt.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
          const uniq = Array.from(new Set(lines));
          uniq.sort((a,b)=>a.localeCompare(b));
          setAllSkills(uniq);
        })
        .catch(() => {});
    }
  }, [isOpen, allSkills.length]);

  // Load colleges.csv once when modal opens
  React.useEffect(() => {
    if (isOpen && allColleges.length === 0) {
      fetch('/colleges.csv')
        .then(r => r.text())
        .then(txt => {
          const lines = txt.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
          const uniq = Array.from(new Set(lines));
          uniq.sort((a,b)=> a.localeCompare(b));
          setAllColleges(uniq);
        })
        .catch(()=>{});
    }
  }, [isOpen, allColleges.length]);

  // Load courses.csv once when modal opens
  React.useEffect(() => {
    if (isOpen && allCourses.length === 0) {
      fetch('/courses.csv')
        .then(r => r.text())
        .then(txt => {
          const lines = txt.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
          const uniq = Array.from(new Set(lines));
          uniq.sort((a,b)=> a.localeCompare(b));
          setAllCourses(uniq);
        })
        .catch(()=>{});
    }
  }, [isOpen, allCourses.length]);

  // Derive suggestions as user types
  React.useEffect(() => {
    if (!skillInput) { setSkillSuggestions([]); return; }
    if (!form) return; // safety guard
    const existing = new Set((Array.isArray(form.skills)?form.skills:[]).map(s=>s.toLowerCase()));
    const q = skillInput.toLowerCase();
    const results = allSkills.filter(s => s.toLowerCase().startsWith(q) && !existing.has(s.toLowerCase())).slice(0,8);
    setSkillSuggestions(results);
  }, [skillInput, allSkills, form]);

  const handleSelectSuggestedSkill = (skill) => {
    if (!skill) return;
    if (!form.skills.includes(skill)) {
      setForm(prev => ({ ...prev, skills: [...prev.skills, skill] }));
      markStepEdited(1);
    }
    setSkillInput('');
    setSkillSuggestions([]);
  };


  




  const handleAddSector = () => {
    const trimmed = sectorInput.trim();
    if (trimmed && !form.sectors.includes(trimmed)) {
      setForm(prev => ({ ...prev, sectors: [...(Array.isArray(prev.sectors) ? prev.sectors : []), trimmed] }));
      setSectorInput("");
      markStepEdited(1);
    }
  };
  const handleRemoveSector = (sector) => {
    setForm(prev => {
      let arr = Array.isArray(prev.sectors) ? prev.sectors : (typeof prev.sectors === 'string' && prev.sectors.length > 0 ? prev.sectors.split(',').map(s => s.trim()).filter(Boolean) : []);
      return { ...prev, sectors: arr.filter(s => s !== sector) };
    });
    markStepEdited(1);
  };

  const handleAddLocation = () => {
    const trimmed = locationInput.trim();
    if (trimmed && !form.preferredLocations.includes(trimmed)) {
      setForm(prev => ({ ...prev, preferredLocations: [...(Array.isArray(prev.preferredLocations) ? prev.preferredLocations : []), trimmed] }));
      setLocationInput("");
      markStepEdited(1);
    }
  };
  const handleRemoveLocation = (loc) => {
    setForm(prev => {
      let arr = Array.isArray(prev.preferredLocations) ? prev.preferredLocations : (typeof prev.preferredLocations === 'string' && prev.preferredLocations.length > 0 ? prev.preferredLocations.split(',').map(s => s.trim()).filter(Boolean) : []);
      return { ...prev, preferredLocations: arr.filter(s => s !== loc) };
    });
    markStepEdited(1);
  };

  const handleAddLanguage = () => {
    const trimmed = languageInput.trim();
    if (trimmed && !form.languagesKnown.includes(trimmed)) {
      setForm(prev => ({ ...prev, languagesKnown: [...(Array.isArray(prev.languagesKnown) ? prev.languagesKnown : []), trimmed] }));
      setLanguageInput("");
      markStepEdited(1);
    }
  };
  const handleRemoveLanguage = (lang) => {
    setForm(prev => {
      let arr = Array.isArray(prev.languagesKnown) ? prev.languagesKnown : (typeof prev.languagesKnown === 'string' && prev.languagesKnown.length > 0 ? prev.languagesKnown.split(',').map(s => s.trim()).filter(Boolean) : []);
      return { ...prev, languagesKnown: arr.filter(s => s !== lang) };
    });
    markStepEdited(1);
  };
  // Load experience records when modal opens
  React.useEffect(() => {
    const fetchExperience = async () => {
      if (isOpen && user && user.id) {
        const { data, error } = await supabase
          .from('experience')
          .select('*')
          .eq('applicant_id', user.id);
        if (!error && Array.isArray(data)) {
          setForm(prev => ({
            ...prev,
            experienceList: data.length > 0 ? data.map(exp => ({
              experience_id: exp.experience_id,
              type: exp.type,
              years: exp.years,
              details: exp.details,
            })) : [
              {
                type: '',
                years: '',
                details: '',
              }
            ]
          }));
        }
      }
    };
    fetchExperience();
  }, [isOpen, user]);
  // Track if form is edited per step
  const markStepEdited = (stepIdx) => {
    setEditedStep(prev => ({ ...prev, [stepIdx]: true }));
  };
  // Load candidate details when modal opens
  React.useEffect(() => {
    const fetchCandidateDetails = async () => {
      if (isOpen && user && user.id) {
        const { data, error } = await supabase
          .from('applicants')
          .select('*')
          .eq('applicant_id', user.id)
          .single();
        if (!error && data) {
          setForm(prev => ({
            ...prev,
            name: data.name || '',
            fatherName: data.father_name || '',
            category: data.category || '',
            disabilityStatus: data.disability_status ? 'Disabled' : 'Not Disabled',
            educationLevel: data.education_level || '',
            major: data.major || '',
            experience: data.experience_years ? data.experience_years.toString() : '0',
            skills: data.skills || '',
            sectors: Array.isArray(data.sectors_of_interest) ? data.sectors_of_interest : [],
            preferredLocations: Array.isArray(data.preferred_locations) ? data.preferred_locations : [],
            remoteOk: !!data.remote_ok,
            preferredLanguage: data.preferred_language || '',
            languagesKnown: Array.isArray(data.languages_known) ? data.languages_known : [],
            mobile: data.mobile_number || '',
            altMobile: data.alt_mobile_number || '',
            email: data.email || '',
            address1: data.address_line1 || '',
            address2: data.address_line2 || '',
            state: data.state || '',
            district: data.district || '',
            pincode: data.pincode || '',
          }));
        }
      }
    };
    fetchCandidateDetails();
  }, [isOpen, user]);
  // Load education records when modal opens
  React.useEffect(() => {
    const fetchEducation = async () => {
      if (isOpen && user && user.id) {
        const { data, error } = await supabase
          .from('education')
          .select('*')
          .eq('applicant_id', user.id);
        if (!error && Array.isArray(data)) {
          setForm(prev => ({
            ...prev,
            educationList: data.length > 0 ? data.map(edu => ({
              education_id: edu.education_id,
              educationLevel: edu.level,
              course: edu.course,
              board_university_name: edu.board_university_name,
              institute_name: edu.institute_name,
              year_of_passing: edu.year_of_passing,
              marks_or_grade: edu.marks_or_grade,
              certificate_file_path: edu.certificate_file_path || null,
            })) : [
              {
                educationLevel: '',
                course: '',
                board_university_name: '',
                institute_name: '',
                year_of_passing: '',
                marks_or_grade: '',
                certificate_file_path: null,
              }
            ]
          }));
        }
      }
    };
    fetchEducation();
  }, [isOpen, user]);
  // Save candidate details to Supabase
  // Save multiple education records to Supabase
  // Save multiple experience records to Supabase
  const saveExperienceDetails = async () => {
    const userId = user && user.id;
    if (!userId) {
      alert('No user id found.');
      return;
    }
    // Fetch applicant_id from applicants table
    const { data: applicant, error: applicantError } = await supabase
      .from('applicants')
      .select('applicant_id')
      .eq('applicant_id', userId)
      .single();
    if (applicantError || !applicant) {
      alert('Error fetching applicant_id: ' + (applicantError?.message || 'Not found'));
      return;
    }
    const applicantId = applicant.applicant_id;
    for (const exp of form.experienceList) {
      const record = {
        applicant_id: applicantId,
        applicant_id: userId,
        type: exp.type,
        years: exp.years,
        details: exp.details,
      };
      if (exp.experience_id) {
        // Update only the record with matching experience_id
        const { data: updateData, error: updateError } = await supabase
          .from('experience')
          .update(record)
          .eq('experience_id', exp.experience_id);
        console.log('Experience update:', { updateData, updateError, record });
        if (updateError) {
          alert('Error updating experience record: ' + updateError.message);
        }
      } else {
        // Insert only if no experience_id
        const { data: inserted, error: insertError } = await supabase
          .from('experience')
          .insert([record])
          .select();
        console.log('Experience insert:', { inserted, insertError, record });
        if (insertError) {
          alert('Error inserting experience record: ' + insertError.message);
        } else if (inserted && inserted.length > 0) {
          exp.experience_id = inserted[0].experience_id;
        }
      }
    }
    // After all operations, fetch latest experience records to sync ids
    const { data: latestData, error: latestError } = await supabase
      .from('experience')
      .select('*')
      .eq('applicant_id', userId);
    if (!latestError && Array.isArray(latestData)) {
      setForm(prev => ({
        ...prev,
        experienceList: latestData.length > 0 ? latestData.map(exp => ({
          experience_id: exp.experience_id,
          type: exp.type,
          years: exp.years,
          details: exp.details,
        })) : [
          {
            type: '',
            years: '',
            details: '',
          }
        ]
      }));
    }
  };
  const saveEducationDetails = async () => {
    const userId = user && user.id;
    if (!userId) {
      alert('No user id found.');
      return;
    }
    // Fetch applicant_id from applicants table
    const { data: applicant, error: applicantError } = await supabase
      .from('applicants')
      .select('applicant_id')
      .eq('applicant_id', userId)
      .single();
    if (applicantError || !applicant) {
      alert('Error fetching applicant_id: ' + (applicantError?.message || 'Not found'));
      return;
    }
    const applicantId = applicant.applicant_id;
    for (const edu of form.educationList) {
      // Normalize matching fields
      const levelNorm = (edu.educationLevel || '').trim().toLowerCase();
      const courseNorm = (edu.course || '').trim().toLowerCase();
      const yearNorm = (edu.year_of_passing || '').toString().trim();
      const record = {
        applicant_id: applicantId,
        applicant_id: userId,
        level: levelNorm,
        course: courseNorm,
        board_university_name: edu.board_university_name,
        institute_name: edu.institute_name,
        year_of_passing: yearNorm,
        marks_or_grade: edu.marks_or_grade,
        // certificate_file_path: handle file upload if needed
      };
      if (edu.education_id) {
        // Update only the record with matching education_id
        const { error: updateError } = await supabase
          .from('education')
          .update(record)
          .eq('education_id', edu.education_id);
        if (updateError) {
          alert('Error updating education record: ' + updateError.message);
        }
      } else {
        // Insert only if no education_id
        const { data: inserted, error: insertError } = await supabase
          .from('education')
          .insert([record])
          .select();
        if (insertError) {
          alert('Error inserting education record: ' + insertError.message);
        } else if (inserted && inserted.length > 0) {
          // Update the form with the new education_id
          edu.education_id = inserted[0].education_id;
        }
      }
    }
    // After all operations, fetch latest education records to sync ids
    const { data: latestData, error: latestError } = await supabase
      .from('education')
      .select('*')
      .eq('applicant_id', userId);
    if (!latestError && Array.isArray(latestData)) {
      setForm(prev => ({
        ...prev,
        educationList: latestData.length > 0 ? latestData.map(edu => ({
          education_id: edu.education_id,
          educationLevel: edu.level,
          course: edu.course,
          board_university_name: edu.board_university_name,
          institute_name: edu.institute_name,
          year_of_passing: edu.year_of_passing,
          marks_or_grade: edu.marks_or_grade,
          certificate_file_path: edu.certificate_file_path || null,
        })) : [
          {
            educationLevel: '',
            course: '',
            board_university_name: '',
            institute_name: '',
            year_of_passing: '',
            marks_or_grade: '',
            certificate_file_path: null,
          }
        ]
      }));
    }
  };
  const saveCandidateDetails = async () => {
    // You may need to get user id from props/context
  const userId = user && user.id;
    if (!userId) {
      alert('No user id found.');
      return;
    }
    const data = {
      name: form.name,
      father_name: form.fatherName,
      category: form.category,
      disability_status: form.disabilityStatus === 'Disabled',
      education_level: form.educationLevel || '',
      major: form.major || '',
      experience_years: parseInt(form.experience) || 0,
  skills: Array.isArray(form.skills) ? form.skills.join(',') : form.skills,
  sectors_of_interest: Array.isArray(form.sectors) ? form.sectors.join(',') : form.sectors,
  preferred_locations: Array.isArray(form.preferredLocations) ? form.preferredLocations.join(',') : form.preferredLocations,
  remote_ok: form.remoteOk,
  preferred_language: form.preferredLanguage,
  languages_known: Array.isArray(form.languagesKnown) ? form.languagesKnown.join(',') : form.languagesKnown,
      mobile_number: form.mobile,
      alt_mobile_number: form.altMobile,
      email: form.email,
      address_line1: form.address1,
      address_line2: form.address2,
      state: form.state,
      district: form.district,
      pincode: form.pincode,
      applicant_id: userId,
    };
    const { error } = await supabase
      .from('applicants')
      .upsert([data], { onConflict: ['applicant_id'] });
    if (error) {
      alert('Error saving candidate details: ' + error.message);
    }
  };

  // Skill input logic
  const handleAddSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !form.skills.includes(trimmed)) {
      setForm(prev => ({ ...prev, skills: [...prev.skills, trimmed] }));
      setSkillInput("");
      markStepEdited(1);
    }
  };
  const handleRemoveSkill = (skill) => {
    setForm(prev => {
      let skillsArr = Array.isArray(prev.skills)
        ? prev.skills
        : (typeof prev.skills === 'string' && prev.skills.length > 0
            ? prev.skills.split(',').map(s => s.trim()).filter(Boolean)
            : []);
      return { ...prev, skills: skillsArr.filter(s => s !== skill) };
    });
    markStepEdited(1);
  };
  // Handle experience entry change
  const handleExperienceChange = (idx, e) => {
    const { name, value } = e.target;
    setForm(prev => {
      const updatedList = prev.experienceList.map((exp, i) =>
        i === idx ? { ...exp, [name]: value } : exp
      );
      return { ...prev, experienceList: updatedList };
    });
    markStepEdited(3);
  };

  // Add new experience entry
  const handleAddExperience = () => {
    setForm(prev => ({
      ...prev,
      experienceList: [
        ...prev.experienceList,
        {
          type: '',
          years: '',
          details: '',
        }
      ]
    }));
  };
  // Handle education entry change
  const handleEducationChange = (idx, e) => {
    const { name, value, files } = e.target;
    setForm(prev => {
      const updatedList = prev.educationList.map((edu, i) =>
        i === idx ? { ...edu, [name]: name === 'certificate_file_path' ? files[0] : value } : edu
      );
      return { ...prev, educationList: updatedList };
    });
    // Generate suggestions when typing board/university or institute name or course
    if (name === 'board_university_name') {
      if (value) {
        const q = value.toLowerCase();
        const suggestions = allColleges.filter(c => c.toLowerCase().includes(q)).slice(0,8);
        setBoardSuggestionsMap(prev => ({ ...prev, [idx]: suggestions }));
      } else {
        setBoardSuggestionsMap(prev => { const n={...prev}; delete n[idx]; return n; });
      }
    }
    if (name === 'institute_name') {
      if (value) {
        const q = value.toLowerCase();
        const suggestions = allColleges.filter(c => c.toLowerCase().includes(q)).slice(0,8);
        setInstituteSuggestionsMap(prev => ({ ...prev, [idx]: suggestions }));
      } else {
        setInstituteSuggestionsMap(prev => { const n={...prev}; delete n[idx]; return n; });
      }
    }
    if (name === 'course') {
      if (value) {
        const q = value.toLowerCase();
        const suggestions = allCourses.filter(c => c.toLowerCase().includes(q)).slice(0,8);
        setCourseSuggestionsMap(prev => ({ ...prev, [idx]: suggestions }));
      } else {
        setCourseSuggestionsMap(prev => { const n={...prev}; delete n[idx]; return n; });
      }
    }
    markStepEdited(2);
  };

  const handleSelectCourseSuggestion = (idx, nameVal) => {
    setForm(prev => {
      const updated = prev.educationList.map((edu,i)=> i===idx ? { ...edu, course: nameVal } : edu);
      return { ...prev, educationList: updated };
    });
    setCourseSuggestionsMap(prev => { const n={...prev}; delete n[idx]; return n; });
    markStepEdited(2);
  };

  const handleSelectBoardSuggestion = (idx, nameVal) => {
    setForm(prev => {
      const updated = prev.educationList.map((edu,i)=> i===idx ? { ...edu, board_university_name: nameVal } : edu);
      return { ...prev, educationList: updated };
    });
    setBoardSuggestionsMap(prev => { const n={...prev}; delete n[idx]; return n; });
    markStepEdited(2);
  };
  const handleSelectInstituteSuggestion = (idx, nameVal) => {
    setForm(prev => {
      const updated = prev.educationList.map((edu,i)=> i===idx ? { ...edu, institute_name: nameVal } : edu);
      return { ...prev, educationList: updated };
    });
    setInstituteSuggestionsMap(prev => { const n={...prev}; delete n[idx]; return n; });
    markStepEdited(2);
  };

  // Add new education entry
  const handleAddEducation = () => {
    setForm(prev => ({
      ...prev,
      educationList: [
        ...prev.educationList,
        {
          educationLevel: '',
          course: '',
          board_university_name: '',
          institute_name: '',
          year_of_passing: '',
          marks_or_grade: '',
          certificate_file_path: null,
        }
      ]
    }));
  };

  if (!isOpen) return null;

  const handleChange = async (e) => {
    const { name, value, files } = e.target;
    if (name === 'resumeFile') {
      const file = files[0];
      setForm({ ...form, resumeFile: file });
      markStepEdited(0);
      if (!file) return;
      try {
        setScanning(true);
        // 1. Upload to Supabase bucket (bucket name: sih)
        const fileExt = file.name.split('.').pop();
        const filePath = `resumes/${user?.id || 'anon'}_${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage.from('sih').upload(filePath, file, { upsert: true });
        if (uploadError) {
          setScanning(false);
          alert('Error uploading resume: ' + uploadError.message);
          return;
        }
        // 2. Get public URL
        const { data: publicUrlData } = supabase.storage.from('sih').getPublicUrl(filePath);
        const publicUrl = publicUrlData?.publicUrl;
        if (!publicUrl) {
          setScanning(false);
          alert('Could not get public URL for uploaded resume.');
          return;
        }
        // 3. Call OCR API
        const ocrRes = await fetch(`https://sihbackend.redstone-ca88ed5e.centralindia.azurecontainerapps.io/pdf?pdf_url=${encodeURIComponent(publicUrl)}`);
        if (!ocrRes.ok) {
          setScanning(false);
          alert('Error fetching OCR details.');
          return;
        }
        const ocrData = await ocrRes.json();
        // 4. Fill form from OCR
        fillFormFromOCR(ocrData);
        setScanning(false);
      } catch (err) {
        setScanning(false);
        alert('Unexpected error during resume upload/OCR: ' + err.message);
      }
    } else {
      setForm({ ...form, [name]: value });
      markStepEdited(step);
    }
  };

  const handleNext = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  // Intercept next for candidate details step
  const handleNextWithSave = async () => {
    if (step === 1) {
      await saveCandidateDetails();
    }
    if (step === 2) {
      await saveEducationDetails();
    }
    if (step === 3) {
      await saveExperienceDetails();
    }
    setStep((s) => Math.min(s + 1, steps.length - 1));
  };
  const handlePrev = () => setStep((s) => Math.max(s - 1, 0));

  const handleSave = async () => {
    setSaved(false);
    await saveExperienceDetails();
    // Call update_embeddings endpoint after save
    try {
      await fetch('https://sihbackend.redstone-ca88ed5e.centralindia.azurecontainerapps.io/update_embeddings', { method: 'POST' });
    } catch (err) {
      // Optionally handle error, but don't block UI
      console.error('Error updating embeddings:', err);
    }
    setSaved(true);
    // Do not close modal
    setTimeout(() => setSaved(false), 5000); // Hide after 5s
  };



  return (
    <>
      {scanning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-transparent">
          <div className="bg-white rounded-lg shadow-lg px-8 py-6 flex flex-col items-center">
            <svg className="animate-spin h-8 w-8 text-blue-600 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
            </svg>
            <span className="text-lg font-semibold text-blue-700">Resume Scanning...</span>
          </div>
        </div>
      )}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        onClick={onClose}
        role="presentation"
      >
        <div
          className="bg-white rounded-lg shadow-lg p-6 w-full max-w-4xl min-h-[350px] flex flex-col justify-between"
          onClick={e => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
        {/* Progress Bar */}
        <div className="w-full mb-6">
          <div className="flex items-center justify-between mb-2">
            {steps.map((s, idx) => (
              <div key={s} className="flex-1 flex flex-col items-center">
                <div className={`w-8 h-8 flex items-center justify-center rounded-full border-2 ${step >= idx ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-200 text-gray-500 border-gray-300'}`}>{idx + 1}</div>
                <span className={`mt-2 text-xs font-medium ${step === idx ? 'text-blue-600' : 'text-gray-500'}`}>{s}</span>
              </div>
            ))}
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full">
            <div className="h-2 bg-blue-600 rounded-full transition-all duration-300" style={{ width: `${((step + 1) / steps.length) * 100}%` }}></div>
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-6 text-center">{steps[step]}</h2>
        <div className="flex-1 overflow-y-auto max-h-[400px] pr-2">
          <form>
          {step === 0 && (
            <>
              <div className="w-full flex flex-col items-center justify-center">
                <label className="block text-sm font-medium mb-2">Upload Resume (PDF/DOC)</label>
                <div
                  className="w-full max-w-md border-2 border-dashed border-blue-400 rounded-xl bg-blue-50 flex flex-col items-center justify-center p-8 cursor-pointer transition hover:bg-blue-100"
                  onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
                  onDrop={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      const file = e.dataTransfer.files[0];
                      if (file.type === 'application/pdf' || file.name.endsWith('.pdf') || file.name.endsWith('.doc') || file.name.endsWith('.docx')) {
                        handleChange({ target: { name: 'resumeFile', files: [file] } });
                      }
                    }
                  }}
                  onClick={() => document.getElementById('resumeFileInput').click()}
                  style={{ minHeight: 180 }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#2563eb" className="w-12 h-12 mb-2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-8m0 0l-3 3m3-3l3 3m-9 4v6a2 2 0 002 2h10a2 2 0 002-2v-6M7 16h10" />
                  </svg>
                  <span className="text-blue-700 font-semibold">Drag & Drop your PDF/DOC here</span>
                  <span className="text-xs text-gray-500 mt-1">or click to select a file</span>
                  {form.resumeFile && (
                    <span className="mt-2 text-green-600 text-sm font-medium">{form.resumeFile.name}</span>
                  )}
                </div>
                <input
                  id="resumeFileInput"
                  name="resumeFile"
                  type="file"
                  accept="application/pdf,.doc,.docx"
                  className="hidden"
                  onChange={handleChange}
                />
                <p className="text-xs text-gray-500 mt-2">Resume will be used to auto-fill details if possible.</p>
              </div>
            </>
          )}
          {step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left column fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Full Name</label>
                  <input name="name" type="text" className="w-full border rounded px-2 py-1 text-sm" value={form.name} onChange={handleChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <input name="category" type="text" className="w-full border rounded px-2 py-1 text-sm" value={form.category} onChange={handleChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Education Level</label>
                  <input name="education" type="text" className="w-full border rounded px-2 py-1 text-sm" value={form.education} onChange={handleChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Experience (Years)</label>
                  <input name="experience" type="number" min="0" className="w-full border rounded px-2 py-1 text-sm" value={form.experience} onChange={handleChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Sectors of Interest</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(Array.isArray(form.sectors) ? form.sectors : (typeof form.sectors === 'string' && form.sectors.length > 0 ? form.sectors.split(',').map(s => s.trim()).filter(Boolean) : [])).map((sector, idx) => (
                      <span key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center text-sm">
                        {sector}
                        <button type="button" className="ml-2 text-blue-400 hover:text-red-500" onClick={() => handleRemoveSector(sector)} title="Remove">×</button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={sectorInput}
                      onChange={e => setSectorInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddSector(); } }}
                      placeholder="Type a sector"
                      className="border rounded px-2 py-1 text-sm"
                    />
                    <button type="button" className="bg-blue-600 text-white px-4 py-1 rounded" onClick={handleAddSector}>Add</button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Remote Work Preference (Remote OK)</label>
                  <select name="remoteOk" className="w-full border rounded px-2 py-1 text-sm" value={form.remoteOk} onChange={handleChange}>
                    <option value={false}>Not Remote</option>
                    <option value={true}>Remote OK</option>
                  </select>
                </div>
                {/* Address Line 1 & 2 side by side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">Address Line 1</label>
                    <input name="address1" type="text" className="w-full border rounded px-2 py-1 text-sm" value={form.address1} onChange={handleChange} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Address Line 2</label>
                    <input name="address2" type="text" className="w-full border rounded px-2 py-1 text-sm" value={form.address2} onChange={handleChange} />
                  </div>
                </div>
                {/* State, District, Pincode together */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">State</label>
                    <input name="state" type="text" className="w-full border rounded px-2 py-1 text-sm" value={form.state} onChange={handleChange} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">District</label>
                    <input name="district" type="text" className="w-full border rounded px-2 py-1 text-sm" value={form.district} onChange={handleChange} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Pincode</label>
                    <input name="pincode" type="text" className="w-full border rounded px-2 py-1 text-sm" value={form.pincode} onChange={handleChange} />
                  </div>
                </div>
              </div>
              {/* Right column fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Father&apos;s Name</label>
                  <input name="fatherName" type="text" className="w-full border rounded px-2 py-1 text-sm" value={form.fatherName} onChange={handleChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Disability Status</label>
                  <select name="disabilityStatus" className="w-full border rounded px-2 py-1 text-sm" value={form.disabilityStatus} onChange={handleChange}>
                    <option value="Not Disabled">Not Disabled</option>
                    <option value="Disabled">Disabled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Major / Field of Study</label>
                  <input name="major" type="text" className="w-full border rounded px-2 py-1 text-sm" value={form.major} onChange={handleChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Skills</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(Array.isArray(form.skills) ? form.skills : (typeof form.skills === 'string' && form.skills.length > 0 ? form.skills.split(',').map(s => s.trim()).filter(Boolean) : [])).map((skill, idx) => (
                      <span key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center text-sm">
                        {skill}
                        <button type="button" className="ml-2 text-blue-400 hover:text-red-500" onClick={() => handleRemoveSkill(skill)} title="Remove">×</button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2 relative">
                    <input
                      type="text"
                      value={skillInput}
                      onChange={e => setSkillInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); skillSuggestions.length ? handleSelectSuggestedSkill(skillSuggestions[0]) : handleAddSkill(); } }}
                      placeholder="Type a skill"
                      className="border rounded px-2 py-1 text-sm"
                      aria-autocomplete="list"
                      aria-expanded={skillSuggestions.length > 0}
                    />
                    <button type="button" className="bg-blue-600 text-white px-4 py-1 rounded" onClick={() => { skillSuggestions.length ? handleSelectSuggestedSkill(skillSuggestions[0]) : handleAddSkill(); }}>Add</button>
                    {skillSuggestions.length > 0 && (
                      <ul className="absolute top-full left-0 mt-1 border rounded bg-white shadow max-h-48 overflow-y-auto text-sm z-30 w-56" role="listbox">
                        {skillSuggestions.map(s => (
                          <li
                            key={s}
                            className="px-3 py-1 hover:bg-blue-50 cursor-pointer"
                            onMouseDown={(e) => { e.preventDefault(); handleSelectSuggestedSkill(s); }}
                            role="option"
                          >
                            {s}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Preferred Locations</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(Array.isArray(form.preferredLocations) ? form.preferredLocations : (typeof form.preferredLocations === 'string' && form.preferredLocations.length > 0 ? form.preferredLocations.split(',').map(s => s.trim()).filter(Boolean) : [])).map((loc, idx) => (
                      <span key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center text-sm">
                        {loc}
                        <button type="button" className="ml-2 text-blue-400 hover:text-red-500" onClick={() => handleRemoveLocation(loc)} title="Remove">×</button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={locationInput}
                      onChange={e => setLocationInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddLocation(); } }}
                      placeholder="Type a location"
                      className="border rounded px-2 py-1 text-sm"
                    />
                    <button type="button" className="bg-blue-600 text-white px-4 py-1 rounded" onClick={handleAddLocation}>Add</button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Preferred Language</label>
                  <input name="preferredLanguage" type="text" className="w-full border rounded px-2 py-1 text-sm" value={form.preferredLanguage} onChange={handleChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Languages Known</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(Array.isArray(form.languagesKnown) ? form.languagesKnown : (typeof form.languagesKnown === 'string' && form.languagesKnown.length > 0 ? form.languagesKnown.split(',').map(s => s.trim()).filter(Boolean) : [])).map((lang, idx) => (
                      <span key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center text-sm">
                        {lang}
                        <button type="button" className="ml-2 text-blue-400 hover:text-red-500" onClick={() => handleRemoveLanguage(lang)} title="Remove">×</button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={languageInput}
                      onChange={e => setLanguageInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddLanguage(); } }}
                      placeholder="Type a language"
                      className="border rounded px-2 py-1 text-sm"
                    />
                    <button type="button" className="bg-blue-600 text-white px-4 py-1 rounded" onClick={handleAddLanguage}>Add</button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Alternate Mobile Number</label>
                  <input name="altMobile" type="tel" className="w-full border rounded px-2 py-1 text-sm" value={form.altMobile} onChange={handleChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input name="email" type="email" className="w-full border rounded px-2 py-1 text-sm" value={form.email} onChange={handleChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Mobile Number</label>
                  <input name="mobile" type="tel" className="w-full border rounded px-2 py-1 text-sm" value={form.mobile} onChange={handleChange} />
                </div>
              </div>
            </div>
          )}
          {step === 2 && (
            <>
              {form.educationList.map((edu, idx) => (
                <div key={idx} className="mb-6 border rounded p-4 bg-gray-50 relative">
                  <button
                    type="button"
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-lg font-bold"
                    title="Remove this education entry"
                    onClick={async () => {
                      if (edu.education_id) {
                        await supabase.from('education').delete().eq('education_id', edu.education_id);
                      }
                      setForm(prev => ({
                        ...prev,
                        educationList: prev.educationList.filter((_, i) => i !== idx)
                      }));
                    }}
                  >×</button>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Education Level</label>
                      <select name="educationLevel" className="w-full border rounded px-3 py-2" value={edu.educationLevel} onChange={e => handleEducationChange(idx, e)}>
                        <option value="">Select Level</option>
                        <option value="Diploma">Diploma</option>
                        <option value="Graduation">Graduation</option>
                        <option value="Post-Graduation">Post-Graduation</option>
                        <option value="Ph.d">Ph.d</option>
                      </select>
                    </div>
                    <div className="relative">
                      <label className="block text-sm font-medium mb-1">Course / Program</label>
                      <input name="course" type="text" className="w-full border rounded px-3 py-2" value={edu.course} onChange={e => handleEducationChange(idx, e)} autoComplete="off" />
                      {courseSuggestionsMap[idx] && courseSuggestionsMap[idx].length > 0 && (
                        <ul className="absolute top-full left-0 mt-1 border rounded bg-white shadow max-h-48 overflow-y-auto text-sm z-30 w-full">
                          {courseSuggestionsMap[idx].map(s => (
                            <li key={s} className="px-3 py-1 hover:bg-blue-50 cursor-pointer" onMouseDown={(e)=>{e.preventDefault(); handleSelectCourseSuggestion(idx,s);}}>{s}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="relative">
                      <label className="block text-sm font-medium mb-1">Board / University Name</label>
                      <input name="board_university_name" type="text" className="w-full border rounded px-3 py-2" value={edu.board_university_name} onChange={e => handleEducationChange(idx, e)} autoComplete="off" />
                      {boardSuggestionsMap[idx] && boardSuggestionsMap[idx].length > 0 && (
                        <ul className="absolute top-full left-0 mt-1 border rounded bg-white shadow max-h-48 overflow-y-auto text-sm z-30 w-full">
                          {boardSuggestionsMap[idx].map(s => (
                            <li key={s} className="px-3 py-1 hover:bg-blue-50 cursor-pointer" onMouseDown={(e)=>{e.preventDefault(); handleSelectBoardSuggestion(idx,s);}}>{s}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="relative">
                      <label className="block text-sm font-medium mb-1">Institute Name</label>
                      <input name="institute_name" type="text" className="w-full border rounded px-3 py-2" value={edu.institute_name} onChange={e => handleEducationChange(idx, e)} autoComplete="off" />
                      {instituteSuggestionsMap[idx] && instituteSuggestionsMap[idx].length > 0 && (
                        <ul className="absolute top-full left-0 mt-1 border rounded bg-white shadow max-h-48 overflow-y-auto text-sm z-30 w-full">
                          {instituteSuggestionsMap[idx].map(s => (
                            <li key={s} className="px-3 py-1 hover:bg-blue-50 cursor-pointer" onMouseDown={(e)=>{e.preventDefault(); handleSelectInstituteSuggestion(idx,s);}}>{s}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Year of Passing</label>
                      <input name="year_of_passing" type="number" min="1900" max="2099" className="w-full border rounded px-3 py-2" value={edu.year_of_passing} onChange={e => handleEducationChange(idx, e)} placeholder="YYYY" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Marks / Grade</label>
                      <input name="marks_or_grade" type="text" className="w-full border rounded px-3 py-2" value={edu.marks_or_grade} onChange={e => handleEducationChange(idx, e)} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1">Upload Certificate (PDF/JPG/PNG)</label>
                      <input name="certificate_file_path" type="file" accept="application/pdf,image/jpeg,image/png" className="w-full border rounded px-3 py-2" onChange={e => handleEducationChange(idx, e)} />
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" className="btn btn-primary" onClick={handleAddEducation}>Add New</button>
            </>
          )}
          {step === 3 && (
            <>
              {form.experienceList.map((exp, idx) => (
                <div key={idx} className="mb-6 border rounded p-4 bg-gray-50 relative">
                  <button
                    type="button"
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-lg font-bold"
                    title="Remove this experience entry"
                    onClick={async () => {
                      if (exp.experience_id) {
                        await supabase.from('experience').delete().eq('experience_id', exp.experience_id);
                      }
                      setForm(prev => ({
                        ...prev,
                        experienceList: prev.experienceList.filter((_, i) => i !== idx)
                      }));
                    }}
                  >×</button>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Experience Type</label>
                      <input name="type" type="text" className="w-full border rounded px-3 py-2" value={exp.type ?? ''} onChange={e => handleExperienceChange(idx, e)} placeholder="e.g. Internship, Job, Project" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Year</label>
                      <input name="years" type="number" min="1900" max="2099" className="w-full border rounded px-3 py-2" value={exp.years ?? ''} onChange={e => handleExperienceChange(idx, e)} placeholder="YYYY" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Details</label>
                      <textarea name="details" className="w-full border rounded px-3 py-2" rows={2} value={exp.details ?? ''} onChange={e => handleExperienceChange(idx, e)} placeholder="Describe your experience" />
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" className="btn btn-primary" onClick={handleAddExperience}>Add New</button>
            </>
          )}
          </form>
        </div>
  <div className="flex flex-col gap-2 mt-6">
    <div className="flex w-full items-center justify-between gap-2">
      <button
        className="btn btn-primary w-32"
        onClick={step === 0 ? onClose : handlePrev}
        type="button"
      >
        {step === 0 ? 'Cancel' : 'Back'}
      </button>
      {step === 0 && (
        <div className="flex gap-3 ml-auto">
          <button
            className="btn btn-secondary w-28"
            type="button"
            onClick={handleNext}
            aria-label="Skip resume upload and fill manually"
          >
            Skip
          </button>
          <button
            className="btn btn-primary w-28"
            onClick={handleNext}
            type="button"
            disabled={!form.resumeFile}
            aria-disabled={!form.resumeFile}
            style={!form.resumeFile ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
          >
            Next
          </button>
        </div>
      )}
      {step > 0 && step < steps.length - 1 && (
        editedStep[step] ? (
          <button
            className="btn btn-primary w-32 ml-auto"
            onClick={handleNextWithSave}
            type="button"
          >
            Save and Next
          </button>
        ) : (
          <button
            className="btn btn-secondary w-32 ml-auto"
            onClick={handleNext}
            type="button"
          >
            Skip
          </button>
        )
      )}
      {step === steps.length - 1 && (
        <button
          className={`btn w-32 ml-auto ${saved ? 'bg-green-600 text-white' : 'btn-primary'}`.trim()}
          onClick={handleSave}
          type="button"
          disabled={saved}
          style={saved ? { backgroundColor: '#16a34a', color: '#fff', borderColor: '#16a34a' } : {}}
        >
          {saved ? (
            <span className="flex items-center justify-center gap-1">Saved
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </span>
          ) : 'Save'}
        </button>
      )}
    </div>
  </div>
        </div>
      </div>
    </>
  );
};

export default ResumeModal;
