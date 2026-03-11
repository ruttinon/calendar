import React from 'react';
import { Settings, CreditCard, HelpCircle, LogOut, ChevronRight, Sparkles } from 'lucide-react';
import './Profile.css';

const OPTIONS_GROUPS = [
    [
        { icon: Settings, title: 'General Settings' },
        { icon: CreditCard, title: 'Billing & Plans' },
    ],
    [
        { icon: HelpCircle, title: 'Help & Support' },
        { icon: LogOut, title: 'Log Out', danger: true },
    ],
];

const Profile = () => (
    <div className="profile-container">
        <header className="profile-header">
            <h1>Profile</h1>
        </header>

        <div className="profile-user-card">
            <div className="profile-avatar">R</div>
            <div className="profile-name">Ratthinon 👋</div>
            <div className="profile-plan">✦ Free Plan</div>
            <button className="upgrade-btn">
                <Sparkles size={15} /> Upgrade to Pro
            </button>
        </div>

        {OPTIONS_GROUPS.map((group, gi) => (
            <div key={gi} className="options-group">
                {group.map(({ icon: Icon, title, danger }) => (
                    <div key={title} className="profile-option">
                        <div className="option-left">
                            <div className={`option-icon-wrap ${danger ? 'danger' : 'neutral'}`}>
                                <Icon size={17} strokeWidth={1.8} />
                            </div>
                            <span className={`option-title ${danger ? 'danger' : ''}`}>{title}</span>
                        </div>
                        {!danger && <ChevronRight size={16} color="var(--color-text-tertiary)" />}
                    </div>
                ))}
            </div>
        ))}

        <p className="app-version">Daily Workspace · v1.1.0</p>
    </div>
);

export default Profile;