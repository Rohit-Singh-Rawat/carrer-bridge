import Navbar from '@/components/landing/navbar';

type Props = {
	children: React.ReactNode;
};

const Layout = ({ children }: Props) => {
	return (
		<>
			<Navbar />
			{children}
		</>
	);
};

export default Layout;
