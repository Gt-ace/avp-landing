import { TextRoll } from './ui/skiper-ui/skiper58'

export default function BigTypeRoll() {
  return (
    <>
      <div className="bigtype-line" data-speed="-0.35">
        <div className="bigtype-shift" data-bigtype-shift>
          <TextRoll className="bigtype-roll">DESIGN BUILD</TextRoll>
        </div>
      </div>
      <div className="bigtype-line" data-speed="0.35">
        <div className="bigtype-shift" data-bigtype-shift>
          <TextRoll className="bigtype-roll" center>
            AUTOMATE RUN
          </TextRoll>
        </div>
      </div>
    </>
  )
}
