import React, { useState } from "react";

interface InputImageCameraProps {
    id: string;
    title: string;
    handleImageChangeIn: (id: string, file: File) => void;
}

export default function InputImageCamera({ id, title, handleImageChangeIn }: InputImageCameraProps) {
    const [image, setImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Limpiar memoria cuando el componente se desmonte
    React.useEffect(() => {
        return () => {
            if (image) URL.revokeObjectURL(image);
        };
    }, [image]);

    const compressImage = (file: File): Promise<File> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const maxSize = 1920;
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > maxSize || height > maxSize) {
                        if (width > height) {
                            height = (height * maxSize) / width;
                            width = maxSize;
                        } else {
                            width = (width * maxSize) / height;
                            height = maxSize;
                        }
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);
                    
                    canvas.toBlob((blob) => {
                        if (blob) {
                            resolve(new File([blob], file.name, { type: 'image/jpeg' }));
                        } else {
                            reject(new Error('Error al comprimir imagen'));
                        }
                    }, 'image/jpeg', 0.85);
                };
                img.onerror = () => reject(new Error('Error al cargar imagen'));
                img.src = e.target?.result as string;
            };
            reader.onerror = () => reject(new Error('Error al leer archivo'));
            reader.readAsDataURL(file);
        });
    };

    const handleCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        
        // Limpiar imagen anterior antes de crear una nueva
        if (image) URL.revokeObjectURL(image);
        
        setLoading(true);
        setError(null);
        
        try {
            const compressed = await compressImage(file);
            setImage(URL.createObjectURL(compressed));
            handleImageChangeIn(id, compressed);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al procesar imagen');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveImage = () => {
        if (image) URL.revokeObjectURL(image);
        setImage(null);
        setError(null);
    };

    return (
        <div className="mt-2">
            {image ? '' : <>
                <label className="block mb-0 text-sm font-medium text-primary-800">{title}</label>
                <div className="w-full py-4 bg-primary-50 rounded-2xl border border-primary-800 gap-3 grid border-dashed">
                    <div className="grid gap-2">
                        <div className="flex items-center justify-center">
                            <label>
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    capture="environment" 
                                    hidden
                                    onChange={handleCapture} 
                                    disabled={loading}
                                />
                                <div className={`flex w-24 h-10 px-2 flex-col rounded-xl shadow text-white text-xs font-semibold leading-4 items-center justify-center cursor-pointer focus:outline-none ${loading ? 'bg-gray-400' : 'bg-primary-100'}`}>
                                    {loading ? '...' : (
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path fill="#02518c" fillRule="evenodd" clipRule="evenodd" d="M7.5 4.58579C7.87507 4.21071 8.38378 4 8.91421 4H15.0858C15.6162 4 16.1249 4.21071 16.5 4.58579L17.9142 6H19C20.1046 6 21 6.89543 21 8V18C21 19.1046 20.1046 20 19 20H5C3.89543 20 3 19.1046 3 18V8C3 6.89543 3.89543 6 5 6H6.08579L7.5 4.58579ZM10 12C10 10.8954 10.8954 10 12 10C13.1046 10 14 10.8954 14 12C14 13.1046 13.1046 14 12 14C10.8954 14 10 13.1046 10 12ZM12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8Z" />
                                        </svg>
                                    )}
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
                {error && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-xs text-red-600">{error}</p>
                    </div>
                )}
            </>}    
            <div className="w-full m-2">
                {image && (<>
                    <label className="block mb-0 text-sm font-medium text-primary-900">{title}</label>
                    <div className="w-full mt-2 inline-flex flex-col items-center gap-2">
                        <img src={image} alt="Foto Capturada" className="rounded-lg" style={{ width: '250px', height: 'auto' }} />
                        <button
                            onClick={handleRemoveImage}
                            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg"
                        >
                            Cambiar foto
                        </button>
                    </div>
                </>)}
            </div>
        </div>
    );
}

/*
import React, { useState } from "react";

interface InputImageCameraProps {
    id: string;
    title: string;
    handleImageChangeIn: (id: string, file: File) => void;
}

export default function InputImageCamera({ id, title, handleImageChangeIn }: InputImageCameraProps) {
    const [image, setImage] = useState<string | null>(null);

    const handleCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const imageUrl = URL.createObjectURL(file);
            setImage(imageUrl);
            handleImageChangeIn(id, file);
        }
    };

    return (
        <div className="mt-2">
            {image?'':<>
            <label className="block mb-0 text-sm font-medium text-primary-800">{title}</label>
            <div className="w-full py-4 bg-primary-50 rounded-2xl border border-primary-800 gap-3 grid border-dashed">
                <div className="grid gap-2">
                    <div className="flex items-center justify-center">
                        <label>
                            <input 
                                type="file" 
                                accept="image/*" 
                                capture="environment" 
                                hidden
                                onChange={handleCapture} 
                            />
                            <div className={`flex w-24 h-10 px-2 flex-col rounded-xl shadow text-white text-xs font-semibold leading-4 items-center justify-center cursor-pointer focus:outline-none ${image ? 'bg-green-500' : 'bg-primary-100'}`}>
                                {image ? 'Listo' : (
                                    <div>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path fill="#02518c" fillRule="evenodd" clipRule="evenodd" d="M7.5 4.58579C7.87507 4.21071 8.38378 4 8.91421 4H15.0858C15.6162 4 16.1249 4.21071 16.5 4.58579L17.9142 6H19C20.1046 6 21 6.89543 21 8V18C21 19.1046 20.1046 20 19 20H5C3.89543 20 3 19.1046 3 18V8C3 6.89543 3.89543 6 5 6H6.08579L7.5 4.58579ZM10 12C10 10.8954 10.8954 10 12 10C13.1046 10 14 10.8954 14 12C14 13.1046 13.1046 14 12 14C10.8954 14 10 13.1046 10 12ZM12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8Z" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                        </label>
                    </div>
                </div>
            </div></>}    
            <div className="w-full m-2">
                {image && (<>
                    <label className="block mb-0 text-sm font-medium text-primary-900">{title}</label>
                    <div className="w-full mt-2 inline-flex justify-center">
                        <img src={image} alt="Foto Capturada" className="rounded-lg" style={{ width: '250px', height: 'auto' }} />
                    </div>
                    </>
                )}
            </div>
        </div>
    );
}
*/