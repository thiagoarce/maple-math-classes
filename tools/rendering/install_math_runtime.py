"""Install exact local MathJax assets from pinned official npm packages.

Run npm install --ignore-scripts in math-runtime first. No package code is
executed by this script. Match the original Git blob hashes, not just filenames.
"""
from pathlib import Path
import hashlib
import json
import shutil
import tempfile

ROOT=Path(__file__).resolve().parent
PACKAGES={
    "fira":"@mathjax/mathjax-fira-font",
    "euler":"@mathjax/mathjax-euler-font-extension",
    "tex-extensions":"mathjax",
}
VERSION="4.1.3"
def git_sha(data):
    return hashlib.sha1(b"blob "+str(len(data)).encode()+b"\0"+data).hexdigest()

def main():
    manifest=json.loads((ROOT/"mathjax-runtime.json").read_text(encoding="utf-8"))
    assert manifest["version"]==VERSION
    npm=ROOT/"math-runtime"/"node_modules"
    sources={}
    for key,pkg in PACKAGES.items():
        base=npm/pkg
        meta=json.loads((base/"package.json").read_text(encoding="utf-8"))
        assert meta["name"]==pkg and meta["version"]==VERSION
        sources[key]=base
    dest=ROOT/"mathjax"/("v"+VERSION)
    dest.parent.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory(dir=dest.parent) as tmp:
        stage=Path(tmp)/"runtime"
        stage.mkdir()
        for entry in manifest["files"]:
            path=Path(entry["path"])
            key=path.parts[0]
            rel=Path(*path.parts[1:])
            base=sources[key]
            matches=[]
            for candidate in base.rglob(rel.name):
                if not candidate.is_file() or candidate.is_symlink():
                    continue
                if candidate.parts[-len(rel.parts):]!=rel.parts:
                    continue
                data=candidate.read_bytes()
                if len(data)==entry["bytes"] and git_sha(data)==entry["git_blob_sha"]:
                    matches.append(data)
            if not matches:
                raise RuntimeError("Original blob not found: "+entry["path"])
            out=stage/path
            out.parent.mkdir(parents=True,exist_ok=True)
            out.write_bytes(matches[0])
        for key,base in sources.items():
            notices=stage/"upstream-notices"/key
            notices.mkdir(parents=True)
            for f in base.rglob("*"):
                if f.is_file() and not f.is_symlink() and f.name.lower().startswith(("license","licence","notice","ofl","copyright","copying")):
                    target=notices/f.relative_to(base)
                    target.parent.mkdir(parents=True,exist_ok=True)
                    shutil.copyfile(f,target)
        if dest.exists():
            shutil.rmtree(dest)
        shutil.move(str(stage),str(dest))
    print(f"Verified {len(manifest['files'])} original MathJax assets")
if __name__=="__main__":
    main()
