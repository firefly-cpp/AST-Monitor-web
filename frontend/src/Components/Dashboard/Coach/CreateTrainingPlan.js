// src/Components/Coach/CreateTrainingPlan.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../../Styles/CreateTrainingPlan.css'; // Import the CSS file

const CreateTrainingPlan = ({ token }) => {
    const [cyclists, setCyclists] = useState([]);
    const [form, setForm] = useState({
        start_time: '',
        duration: 0,
        total_distance: 0,
        hr_avg: 0,
        altitude_avg: 0,
        altitude_max: 0,
        calories: 0,
        ascent: 0,
        descent: 0,
        cyclist_ids: []
    });

    useEffect(() => {
        axios.get('http://localhost:5000/coach/athletes', { headers: { Authorization: `Bearer ${token}` } })
            .then(response => {
                setCyclists(response.data);
            })
            .catch(error => {
                console.error("There was an error fetching the cyclists!", error);
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
        setForm({
            ...form,
            cyclist_ids: checked
                ? [...form.cyclist_ids, value]
                : form.cyclist_ids.filter(id => id !== value)
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        axios.post('http://localhost:5000/coach/create_training_plan', form, {
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
            <form onSubmit={handleSubmit} className="training-plan-form">
                <label className="form-label">
                    Start Time:
                    <input type="datetime-local" name="start_time" onChange={handleChange} required className="form-input" />
                </label>
                <label className="form-label">
                    Duration (minutes):
                    <input type="number" name="duration" onChange={handleChange} required className="form-input" />
                </label>
                <label className="form-label">
                    Total Distance:
                    <input type="number" name="total_distance" onChange={handleChange} required className="form-input" />
                </label>
                <label className="form-label">
                    Average Heart Rate:
                    <input type="number" name="hr_avg" onChange={handleChange} className="form-input" />
                </label>
                <label className="form-label">
                    Average Altitude:
                    <input type="number" name="altitude_avg" onChange={handleChange} className="form-input" />
                </label>
                <label className="form-label">
                    Max Altitude:
                    <input type="number" name="altitude_max" onChange={handleChange} className="form-input" />
                </label>
                <label className="form-label">
                    Calories:
                    <input type="number" name="calories" onChange={handleChange} className="form-input" />
                </label>
                <label className="form-label">
                    Ascent:
                    <input type="number" name="ascent" onChange={handleChange} className="form-input" />
                </label>
                <label className="form-label">
                    Descent:
                    <input type="number" name="descent" onChange={handleChange} className="form-input" />
                </label>
                <fieldset className="form-fieldset">
                    <legend>Select Cyclists</legend>
                    <div className="cyclist-list">
                        {cyclists.map(cyclist => (
                            <label key={cyclist.cyclistID} className="cyclist-item">
                                <input
                                    type="checkbox"
                                    name="cyclist_ids"
                                    value={cyclist.cyclistID}
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
