const Brujula = ({ className, ...props }) => {
    return (
        <svg height="24" width="24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
            <circle cx="12" cy="12" r="10" />
            <path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36z" />
        </svg>
    );
}

export default Brujula
