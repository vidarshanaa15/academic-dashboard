import { useState, useEffect } from 'react'
import axios from 'axios'
import SubjectTile from './components/SubjectTile'

function App() {
  // const [count, setCount] = useState(0);
  // const fetchAPI = async () => {
  //   const response = await axios.get("http://localhost:5000/api");
  //   console.log(response.data.fruits);
  // };
  // useEffect(() => {
  //   fetchAPI();
  // }, []);

  const [grades, setGrades] = useState([]);
  const [credits, setCredit] = useState([]);

  const handleGradeChange = (subj, grade) => {
    grade = parseInt(grade);
    if (grade !== 0) grade += 4;  // grade starts from C=5
    setGrades(prev => ({
      ...prev, [subj]: grade
    }));
  };

  const handleCreditChange = (subj, credit) => {
    credit = parseFloat(credit);
    setCredit(prev => ({
      ...prev, [subj]: credit
    }));
  }

  const calculateGPA = () => {
    let totalPoints = 0;
    let totalCredits = 0;

    // cant use .forEach on grades directly as it is not JS arr, it is an object
    Object.keys(grades).forEach(subj => {
      const grade = grades[subj];
      const credit = credits[subj];
      if (grade && credit) {
        totalPoints += grade * credit;
        totalCredits += credit;
      }

      const gpa = totalPoints / totalCredits;
      document.getElementById("result").innerText = gpa.toFixed(2);
    });
  }

  // console log for debugging
  useEffect(() => {
    console.log(grades);
    console.log(credits);
  }, [grades, credits]);

  return (
    <div>
      <SubjectTile name='COA' onGradeChange={handleGradeChange} onCreditChange={handleCreditChange} />
      <SubjectTile name='DSA' onGradeChange={handleGradeChange} onCreditChange={handleCreditChange} />
      <SubjectTile name='DSA Lab' onGradeChange={handleGradeChange} onCreditChange={handleCreditChange} />
      <SubjectTile name='SEPP' onGradeChange={handleGradeChange} onCreditChange={handleCreditChange} />
      <SubjectTile name='Tamil' onGradeChange={handleGradeChange} onCreditChange={handleCreditChange} />
      <SubjectTile name='Math' onGradeChange={handleGradeChange} onCreditChange={handleCreditChange} />
      <SubjectTile name='Physics' onGradeChange={handleGradeChange} onCreditChange={handleCreditChange} />
      <button onClick={calculateGPA}>Calculate GPA</button>
      <p id="result"></p>
    </div>
  )
}

export default App
