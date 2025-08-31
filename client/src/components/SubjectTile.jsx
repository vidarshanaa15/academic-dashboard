import React, { useState, useEffect } from 'react'

function SubjectTile(props) {
    const [selectedGrade, setSelectedGrade] = useState('');
    const [credit, setCredit] = useState(0);

    function handleChange(e) {
        const newGrade = e.target.value
        setSelectedGrade(newGrade);
        props.onGradeChange(props.name, newGrade);
    }

    function handleCreditChange(e) {
        const newCredit = e.target.value;
        setCredit(newCredit);
        props.onCreditChange(props.name, newCredit);
    }

    return (
        <div>
            <p>{props.name}</p>
            <input type="range" min="0" max="6" onChange={handleChange} defaultValue={0} required />
            <input type="number" placeholder="Credits" onChange={handleCreditChange} required />
        </div >
    )
}

export default SubjectTile;