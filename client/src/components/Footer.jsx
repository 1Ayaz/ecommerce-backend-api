import { MapPin, Phone, Mail, Instagram, Facebook, Clock, ShieldCheck } from 'lucide-react';

const serviceAreas = [
    "Alcot Gardens", "Anandapeta", "Annapurnampeta", "APHB Colony", "Aryapuram", "Auto Nagar",
    "AV Appa Rao Road", "Battina Nagar", "Bhaskar Nagar", "Bommuru", "Burugupudi", "Chakradwarabandham",
    "Churchpeta", "Cycle Colony", "Danavaipeta", "Diwancheruvu", "Dowlaiswaram", "FCI Godowns",
    "Fort Gate", "Gadala", "Gandhi Puram", "Hukumpeta", "Industrial Estate", "Innespeta",
    "Janardhana Nagar", "Jawaharlal Nehru Road", "Kambala Cheruvu", "Katheru", "Kolamuru",
    "Konthamuru", "Korukonda", "Lalacheruvu", "Lalitha Nagar", "Madhurapudi", "Mallikarjuna Nagar",
    "Mangalavaripeta", "Morampudi", "Namavaram", "Navabharat Nagar", "Nehru Nagar", "Nidadavolu",
    "Padmavathi Nagar", "Palacherla", "Pallakadiyam", "Prakasam Nagar", "Rajavolu", "Rajendra Nagar",
    "Ramakrishna Nagar", "Rayudu Pakalu", "Reddy Gari Layout", "Seshayya Metta", "Seethampet",
    "Spinning Mills Colony", "Sriramnagar", "Stadium Road", "Subba Rao Peta", "Syamalamba Temple",
    "Tapeswaram", "Torredu", "Uppara Peta", "Vemagiri", "Venkateswara Nagar", "Vidyuth Colony",
    "VL Puram", "Vullithota"
];

export default function Footer() {
    return (
        <footer className="bg-brand-dark text-white pt-16 pb-8 px-4">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                {/* Brand & Contact */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-brand-red rounded-xl flex items-center justify-center font-black text-xl italic shadow-glow">M</div>
                        <span className="text-xl font-bold tracking-tight">Mubarak Fresh</span>
                    </div>
                    <p className="text-sm opacity-60 leading-relaxed">
                        Premium Halal chicken delivery in Rajahmundry. We ensure the highest hygiene standards, cutting fresh specifically for your order.
                    </p>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm opacity-80">
                            <MapPin size={18} className="text-brand-red" />
                            <span>CTRI Road, Rajahmundry, AP 533105</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm opacity-80">
                            <Phone size={18} className="text-brand-red" />
                            <span>+91 7013693669</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm opacity-80">
                            <Mail size={18} className="text-brand-red" />
                            <span>contact@mubarakchicken.com</span>
                        </div>
                    </div>
                </div>

                {/* Quick Links */}
                <div>
                    <h4 className="font-bold mb-6 uppercase text-xs tracking-widest text-brand-red">Customer Support</h4>
                    <ul className="space-y-4 text-sm opacity-60">
                        <li><a href="#" className="hover:text-brand-red transition-colors">About Us</a></li>
                        <li><a href="#" className="hover:text-brand-red transition-colors">Contact Us</a></li>
                        <li><a href="#" className="hover:text-brand-red transition-colors">FAQ's</a></li>
                        <li><a href="#" className="hover:text-brand-red transition-colors">Returns & Refunds</a></li>
                        <li><a href="#" className="hover:text-brand-red transition-colors">Shipping Policy</a></li>
                        <li><a href="#" className="hover:text-brand-red transition-colors">Terms & Conditions</a></li>
                    </ul>
                </div>

                {/* Areas We Serve */}
                <div className="lg:col-span-2">
                    <h4 className="font-bold mb-6 uppercase text-xs tracking-widest text-brand-red">Areas We Serve</h4>
                    <div className="flex flex-wrap gap-2">
                        {serviceAreas.map((area) => (
                            <span key={area} className="text-[10px] bg-white/5 border border-white/10 px-2 py-1 rounded hover:bg-brand-red/20 transition-colors cursor-default">
                                {area}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-[10px] opacity-40 uppercase tracking-widest text-center md:text-left">
                    Copyright © 2026 MUBARAKCHICKEN.COM | ALL RIGHTS RESERVED
                </p>
                <div className="flex gap-4">
                    <Instagram size={18} className="opacity-40 hover:opacity-100 cursor-pointer transition-opacity" />
                    <Facebook size={18} className="opacity-40 hover:opacity-100 cursor-pointer transition-opacity" />
                </div>
            </div>
        </footer>
    );
}
