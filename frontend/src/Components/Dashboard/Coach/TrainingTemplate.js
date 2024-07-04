import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../../Styles/CreateTrainingPlan.css';
import thrashIcon from '../../../Photos/thrashIcon.png';

const TrainingTemplate = ({ token, templates, setTemplates, handleTemplateSelect, selectedTemplate }) => {
    const [newTemplate, setNewTemplate] = useState({
        type: 'endurance',
        duration: 0,
        distance: 0,
        intensity: '',
        notes: ''
    });
    const [showNewTemplateForm, setShowNewTemplateForm] = useState(false);

    const handleCreateTemplateChange = (e) => {
        const { name, value } = e.target;
        setNewTemplate({
            ...newTemplate,
            [name]: value
        });
    };

    const handleCreateTemplateSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:5000/coach/create_training_plan_template', newTemplate, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTemplates([...templates, response.data]);
            setNewTemplate({
                type: 'endurance',
                duration: 0,
                distance: 0,
                intensity: '',
                notes: ''
            });
            setShowNewTemplateForm(false);
        } catch (error) {
            console.error("There was an error creating the template!", error);
        }
    };

    const handleDeleteTemplate = async (templateID) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this template?");
        if (confirmDelete) {
            try {
                await axios.delete(`http://localhost:5000/coach/delete_training_plan_template/${templateID}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setTemplates(templates.filter(template => template.sessionID !== templateID));
            } catch (error) {
                console.error("There was an error deleting the template!", error);
            }
        }
    };

    return (
        <div className="training-template">
            <button onClick={() => setShowNewTemplateForm(!showNewTemplateForm)} className="submit-button">
                {showNewTemplateForm ? "Hide New Template Form" : "Create New Training Template"}
            </button>
            {showNewTemplateForm && (
                <fieldset className="form-fieldset">
                    <legend>Create New Template</legend>
                    <form onSubmit={handleCreateTemplateSubmit} className="create-template-form">
                        <label className="form-label">
                            Type:
                            <select name="type" value={newTemplate.type} onChange={handleCreateTemplateChange} required className="form-input">
                                <option value="endurance">Endurance</option>
                                <option value="interval">Interval</option>
                                <option value="recovery">Recovery</option>
                            </select>
                        </label>
                        <label className="form-label">
                            Duration (minutes):
                            <input type="number" name="duration" value={newTemplate.duration} onChange={handleCreateTemplateChange} required className="form-input" />
                        </label>
                        <label className="form-label">
                            Distance (km):
                            <input type="number" name="distance" value={newTemplate.distance} onChange={handleCreateTemplateChange} required className="form-input" />
                        </label>
                        <label className="form-label">
                            Intensity (Heartrate range, for example: 120-140):
                            <input type="text" name="intensity" value={newTemplate.intensity} onChange={handleCreateTemplateChange} className="form-input" />
                        </label>
                        <label className="form-label">
                            Notes:
                            <textarea name="notes" value={newTemplate.notes} onChange={handleCreateTemplateChange} className="form-input"></textarea>
                        </label>
                        <button type="submit" className="submit-button">Create Template</button>
                    </form>
                </fieldset>
            )}
            <div className="template-list">
                {templates.map(template => (
                    <div key={template.sessionID}
                        className={`template-card ${selectedTemplate && selectedTemplate.sessionID === template.sessionID ? 'selected' : ''}`}
                        onClick={() => handleTemplateSelect(template)}>
                        <h4>{template.type}</h4>
                        <p>Duration: {template.duration}</p>
                        <p>Distance: {template.distance} km</p>
                        <p>Intensity (Heartrate range): {template.intensity}</p>
                        <p>Notes: {template.notes}</p>
                        <img src={thrashIcon} alt="Delete" className="delete-icon" onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTemplate(template.sessionID);
                        }} />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TrainingTemplate;
