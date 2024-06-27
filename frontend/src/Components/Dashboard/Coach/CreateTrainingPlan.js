import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../../Styles/CreateTrainingPlan.css';
import thrashIcon from '../../../Photos/thrashIcon.png';

const CreateTrainingPlan = ({ token }) => {
    const [cyclists, setCyclists] = useState([]);
    const [form, setForm] = useState({
        start_date: '',
        description: '',
        sessions: []
    });
    const [selectedCyclists, setSelectedCyclists] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [newTemplate, setNewTemplate] = useState({
        type: 'endurance',
        duration: 0,
        distance: 0,
        intensity: '',
        notes: ''
    });
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [showNewTemplateForm, setShowNewTemplateForm] = useState(false);
    const [selectAll, setSelectAll] = useState(false);

    useEffect(() => {
        axios.get('http://localhost:5000/coach/athletes', { headers: { Authorization: `Bearer ${token}` } })
            .then(response => {
                setCyclists(response.data);
            })
            .catch(error => {
                console.error("There was an error fetching the cyclists!", error);
            });
        axios.get('http://localhost:5000/coach/training_plan_templates', { headers: { Authorization: `Bearer ${token}` } })
            .then(response => {
                setTemplates(response.data);
            })
            .catch(error => {
                console.error("There was an error fetching the templates!", error);
            });
    }, [token]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({
            ...form,
            [name]: value
        });
    };

    const handleCheckboxChange = (e) => {
        const { value, checked } = e.target;
        setSelectedCyclists(checked
            ? [...selectedCyclists, value]
            : selectedCyclists.filter(id => id !== value));
    };

    const handleTemplateSelect = (template) => {
        setSelectedTemplate(template);
        setForm({
            ...form,
            sessions: [template]
        });
    };

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
            setShowNewTemplateForm(false); // Hide form after submission
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

    const handleSelectAllCyclists = (e) => {
        const { checked } = e.target;
        setSelectAll(checked);
        setSelectedCyclists(checked ? cyclists.map(cyclist => cyclist.cyclistID.toString()) : []);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const data = { ...form, cyclist_ids: selectedCyclists };
        axios.post('http://localhost:5000/coach/create_training_plan', data, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(response => {
                alert('Training plan created successfully!');
            })
            .catch(error => {
                console.error("There was an error creating the training plan!", error);
            });
    };

    return (
        <div className="create-training-plan">
            <h2>Create Training Plan</h2>
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
            <form onSubmit={handleSubmit} className="training-plan-form">
                <label className="form-label">
                    Start Date:
                    <input type="datetime-local" name="start_date" onChange={handleChange} value={form.start_date} required className="form-input" />
                </label>
                <label className="form-label">
                    Description:
                    <textarea name="description" onChange={handleChange} value={form.description} className="form-input"></textarea>
                </label>
                <fieldset className="form-fieldset">
                    <legend>Select Cyclists</legend>
                    <div className="cyclist-list">
                        <label className="cyclist-item select-all-container">
                            <input
                                type="checkbox"
                                name="selectAll"
                                checked={selectAll}
                                onChange={handleSelectAllCyclists}
                                className="form-checkbox"
                            />
                            <span>Select all</span>
                        </label>
                        {cyclists.map(cyclist => (
                            <label key={cyclist.cyclistID} className="cyclist-item">
                                <input
                                    type="checkbox"
                                    name="cyclist_ids"
                                    value={cyclist.cyclistID}
                                    checked={selectedCyclists.includes(cyclist.cyclistID.toString())}
                                    onChange={handleCheckboxChange}
                                    className="form-checkbox"
                                />
                                <span>{cyclist.username}</span>
                            </label>
                        ))}
                    </div>
                </fieldset>
                <fieldset className="form-fieldset">
                    <legend>Select Templates</legend>
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
                </fieldset>
                <button type="submit" className="submit-button">Create Plan</button>
            </form>


        </div>
    );
};

export default CreateTrainingPlan;
