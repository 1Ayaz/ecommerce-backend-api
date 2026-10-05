import { useEffect } from 'react';

export default function LegalPage() {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="max-w-3xl mx-auto px-6 py-12 bg-white min-h-screen">
            <h1 className="text-3xl font-black text-gray-900 mb-2">Legal Policies</h1>
            <p className="text-sm text-slate-500 mb-8">Last Updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

            {/* --- PRIVACY POLICY --- */}
            <section className="mb-12" id="privacy">
                <h2 className="text-2xl font-bold text-[#D11243] mb-4 pb-2 border-b border-gray-100">Privacy Policy</h2>
                
                <div className="space-y-5 text-sm text-gray-700 leading-relaxed">
                    <p>
                        Welcome to <strong>The Fresh Cuts</strong>. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website/app and tell you about your privacy rights.
                    </p>

                    <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">1. Data We Collect</h3>
                        <p>We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-600">
                            <li><strong>Identity & Contact Data:</strong> Name, phone number, delivery address, and GPS location.</li>
                            <li><strong>Transaction Data:</strong> Details about payments and details of products you have purchased from us.</li>
                            <li><strong>Communication Data:</strong> We collect your phone number primarily to facilitate order fulfillment and to send you transactional updates (including OTPs for login and order status alerts) via SMS or WhatsApp.</li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">2. How We Use Your Data</h3>
                        <p>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-600">
                            <li>To register you as a new customer using mobile OTP verification.</li>
                            <li>To process and deliver your order, including sharing your location with our delivery partners.</li>
                            <li>To manage our relationship with you, including sending you WhatsApp notifications regarding your order status.</li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">3. Third-Party Services (Meta/WhatsApp)</h3>
                        <p>
                            We use the Meta Cloud API (WhatsApp Business Platform) to send you authentication codes (OTPs) and order notifications. By using our service and providing your phone number, you consent to receiving these transactional WhatsApp messages. We do not sell your phone number or data to third-party advertisers.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">4. Data Security</h3>
                        <p>
                            We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way, altered, or disclosed. Access to your personal data is limited to those employees, agents, and delivery partners who have a business need to know.
                        </p>
                    </div>
                </div>
            </section>


            {/* --- TERMS OF SERVICE --- */}
            <section id="terms">
                <h2 className="text-2xl font-bold text-[#D11243] mb-4 pb-2 border-b border-gray-100">Terms of Service</h2>
                
                <div className="space-y-5 text-sm text-gray-700 leading-relaxed">
                    <p>
                        By accessing and placing an order with <strong>The Fresh Cuts</strong>, you confirm that you are in agreement with and bound by the terms of service contained below.
                    </p>

                    <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">1. Service Availability</h3>
                        <p>
                            We currently operate and deliver exclusively in specific operational zones within our delivery radius. If your delivery address falls outside our active delivery zone, we reserve the right to cancel the order or restrict checkout.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">2. Delivery Times</h3>
                        <p>
                            Our "20-minute delivery" promise is an estimate based on optimal traffic and weather conditions. Actual delivery times may vary due to unforeseen circumstances. We do not offer financial compensation for delayed deliveries.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">3. Product Quality & Returns</h3>
                        <p>
                            Because we deal in fresh, perishable goods (raw poultry and meat), all sales are final upon delivery. Please inspect your order at the time of delivery. If you receive an incorrect or spoiled item, please contact our support team immediately (within 1 hour of delivery) for a replacement or refund.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">4. User Accounts & WhatsApp Communications</h3>
                        <p>
                            To place an order, you must create an account using a valid phone number. You are responsible for maintaining the confidentiality of your OTPs and account. By registering, you agree to receive transactional communications from us via WhatsApp or SMS.
                        </p>
                    </div>
                    
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">5. Pricing and Payments</h3>
                        <p>
                            All prices are subject to change without notice. We make every effort to ensure pricing is accurate, but errors may occur. Payments must be completed via the authorized payment gateways provided at checkout or via Cash on Delivery (if eligible).
                        </p>
                    </div>
                </div>
            </section>
            
            <div className="mt-12 pt-8 border-t border-gray-100 text-center text-xs text-slate-400">
                &copy; {new Date().getFullYear()} The Fresh Cuts. All rights reserved.
            </div>
        </div>
    );
}
