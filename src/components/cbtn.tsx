import confetti from 'canvas-confetti';

export default function ConfettiButton({ text, onc, type }: any) {
    const popConfetti = () => {
        confetti({
            particleCount: 120,
            spread: 70,
            origin: { y: 0.6 },
        });
    };

    return (
        <div onClick={onc}>
            <button
                type={type}
                onClick={popConfetti}
                className="bg-[var(--clr-celadon)] text-white py-3 rounded-lg font-semibold hover:opacity-90 transition px-6 w-full"
            >
                {text}
            </button>
        </div>
    );
}
