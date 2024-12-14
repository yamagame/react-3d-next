import Image from 'next/image'
import { useState } from 'react'

const urlPrefix = process.env.NEXT_PUBLIC_BRANCH_NAME ? '/' + process.env.NEXT_PUBLIC_BRANCH_NAME : ''

export function Contributor() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button type="button" onClick={() => void setOpen((p) => !p)} className="contributor-button">
        <Image
          alt="作成者を見る"
          width={24}
          height={24}
          src={urlPrefix + '/info.svg'}
          style={{
            height: '16px',
            width: '16px',
          }}
        />
      </button>
      <div
        className="contributor-container"
        style={{
          display: open ? 'flex' : 'none',
        }}
      >
        <div className="contributor">
          <button type="button" className="contributor-close-button" onClick={() => void setOpen(false)}>
            <Image
              alt="閉じる"
              width={24}
              height={24}
              src={urlPrefix + '/close.svg'}
              style={{
                height: '1.5em',
                width: '1.5em',
              }}
            />
          </button>
          <div>電気通信大学 3Dマップ作成者</div>
          <div style={{ marginLeft: '1em' }}>
            <div style={{ marginTop: '1em' }}>
              伊藤啓太
              <br />
              長沢真帆
              <br />
              西田怜央
              <br />他
            </div>
            <div style={{ marginTop: '0.8em' }}>
              渡邉優
              <br />
              庄野逸
              <br />
              山口博光
              <br />
              島崎俊介
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
