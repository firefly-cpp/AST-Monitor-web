import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TrainingTemplate from './TrainingTemplate';
import '../../../Styles/CreateTrainingPlan.css';

const CreateTrainingPlan = ({ token }) => {
    const [cyclists, setCyclists] = useState([]);
    const [form, setForm] = useState({
        start_date: '',
        description: '',
        sessions: []
    });
    const [selectedCyclists, setSelectedCyclists] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
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
            <TrainingTemplate
                token={token}
                templates={templates}
                setTemplates={setTemplates}
                handleTemplateSelect={handleTemplateSelect}
                selectedTemplate={selectedTemplate}
            />
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
                <button type="submit" className="submit-button">Create Plan</button>
            </form>
        </div>
    );
};

export default CreateTrainingPlan;
