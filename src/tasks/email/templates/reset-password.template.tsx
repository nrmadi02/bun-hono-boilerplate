/** @jsxImportSource react */
import {
	Body,
	Button,
	Container,
	Head,
	Hr,
	Html,
	Preview,
	Section,
	Tailwind,
	Text,
} from "@react-email/components";

interface ResetPasswordTemplateProps {
	token: string;
}

const baseUrl = process.env.BASE_URL;

export const ResetPasswordTemplate = ({
	token,
}: ResetPasswordTemplateProps) => (
	<Html>
		<Head />
		<Tailwind>
			<Body className="bg-white">
				<Preview>Reset password Anda untuk melanjutkan.</Preview>
				<Container className="mx-auto py-5 pb-12 px-5">
					<Text className="text-[16px] leading-[26px]">Halo,</Text>
					<Text className="text-[16px] leading-[26px]">
						Kami menerima permintaan untuk mereset password akun Anda. Klik
						tombol di bawah ini untuk membuat password baru.
					</Text>
					<Section className="text-center">
						<Button
							className="bg-[#5F51E8] rounded-[3px] text-white text-[16px] no-underline text-center block p-3"
							href={`${baseUrl}/auth/reset-password?token=${token}`}
						>
							Reset Password
						</Button>
					</Section>
					<Text className="text-[16px] leading-[26px]">
						Jika Anda tidak meminta reset password, abaikan email ini. Password
						Anda tidak akan berubah.
					</Text>
					<Text className="text-[16px] leading-[26px]">
						Link ini akan kedaluwarsa dalam waktu tertentu untuk keamanan akun
						Anda.
					</Text>
					<Text className="text-[16px] leading-[26px]">
						Salam,
						<br />
						Tim Hono Bun
					</Text>
					<Hr className="border-[#cccccc] my-5" />
					<Text className="text-[#8898aa] text-[12px]">
						Banjarbaru, Kalimantan Selatan, Indonesia
					</Text>
				</Container>
			</Body>
		</Tailwind>
	</Html>
);

export default ResetPasswordTemplate;
