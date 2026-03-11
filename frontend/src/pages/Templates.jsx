import React, { useState, useEffect } from 'react';
import { Search, Star, DollarSign, Download, Lock } from 'lucide-react';
import * as api from '../api';
import './Templates.css';

const CATEGORIES = ['All', 'Study', 'Work', 'Productivity', 'Personal'];

const Templates = () => {
    const [templatesData, setTemplatesData] = useState([]);
    const [activeTab, setActiveTab] = useState('marketplace');
    const [activeCategory, setActiveCategory] = useState('All');

    useEffect(() => {
        api.getTemplates().then(setTemplatesData);
    }, []);

    const filtered = templatesData.filter(t => {
        const catMatch = activeCategory === 'All' || t.category === activeCategory;
        if (activeTab === 'marketplace') return catMatch && t.price > 0;
        return catMatch && t.price === 0;
    });

    return (
        <div className="templates-container">
            <header className="templates-header">
                <h1>Templates</h1>
                <button className="icon-btn"><Search size={20} strokeWidth={1.5} /></button>
            </header>

            <div className="segment-control">
                {['my-templates', 'marketplace'].map(tab => (
                    <button key={tab} className={`segment-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
                        {tab === 'my-templates' ? 'My Templates' : 'Marketplace'}
                    </button>
                ))}
            </div>

            <div className="category-scroll">
                {CATEGORIES.map(cat => (
                    <button key={cat} className={`category-pill ${activeCategory === cat ? 'active' : ''}`} onClick={() => setActiveCategory(cat)}>
                        {cat}
                    </button>
                ))}
            </div>

            <div className="templates-scroll">
                {filtered.length === 0 ? (
                    <div className="empty-templates">
                        <div className="empty-icon-wrap">
                            <Lock size={32} strokeWidth={1.5} />
                        </div>
                        <h3>No Templates Found</h3>
                        <p>Try switching categories or check back later for more.</p>
                    </div>
                ) : (
                    <div className="templates-grid">
                        {filtered.map(t => (
                            <div key={t.id} className="template-card">
                                <div className="template-preview">
                                    <span className="template-watermark">{t.title}</span>
                                    {t.price > 0 && <span className="premium-badge"><Lock size={9} /> PRO</span>}
                                </div>
                                <div className="template-info">
                                    <div className="template-name">{t.title}</div>
                                    <div className="template-meta">
                                        <span>{t.category}</span>
                                        <span className="template-rating"><Star size={10} fill="currentColor" /> {t.rating}</span>
                                    </div>
                                    <button className={`template-action-btn ${t.price > 0 ? 'buy' : 'use'}`}>
                                        {t.price > 0 ? <><DollarSign size={12} />{t.price}</> : <><Download size={12} /> Use</>}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Templates;