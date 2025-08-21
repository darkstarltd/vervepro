import React, { useState, ReactNode, useEffect } from 'react';
import { Style, Element, Viewport, ThemeToken, DeepReadonly, CustomComponent, WebStyle } from '../types';
import { useAppContext } from '../context/AppContext';
import { ChevronDown, X } from 'lucide-react';
import { AlignCenter, AlignEndHorizontal, AlignStartHorizontal, ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Laptop, Smartphone, Tablet, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { generateResponsiveStylesFromDesktop } from '../lib/ai';
import { ColorPicker } from './ColorPicker';


interface StylePropertyEditorProps {
    element: DeepReadonly<Element>;
    onStyleChange: (style: string, value: any, viewport: Viewport) => void;
    onAiResponsiveGenerated: (styles: { tablet: Style, mobile: Style }) => void;
    parentElement: DeepReadonly<Element> | null;
    mainComponentDef: DeepReadonly<CustomComponent> | null;
}

const getResponsiveValue = (
    elementStyles: DeepReadonly<Element['styles']>,
    viewport: Viewport,
    key: string,
    mainComponentDef?: DeepReadonly<CustomComponent> | null
): { value: any, source: Viewport, isOverridden: boolean } => {
    const desktopVal = (elementStyles.desktop as any)?.[key];
    const tabletVal = (elementStyles.tablet as any)?.[key];
    const mobileVal = (elementStyles.mobile as any)?.[key];

    let isOverridden = false;
    if (mainComponentDef) {
        const mainDesktop = (mainComponentDef.mainElement.styles.desktop as any)?.[key];
        const mainTablet = (mainComponentDef.mainElement.styles.tablet as any)?.[key];
        const mainMobile = (mainComponentDef.mainElement.styles.mobile as any)?.[key];
        
        if (viewport === 'mobile' && mobileVal !== undefined && mobileVal !== mainMobile) isOverridden = true;
        else if (viewport === 'tablet' && tabletVal !== undefined && tabletVal !== mainTablet) isOverridden = true;
        else if (viewport === 'desktop' && desktopVal !== undefined && desktopVal !== mainDesktop) isOverridden = true;
    }

    if (viewport === 'mobile') {
        if (mobileVal !== undefined) return { value: mobileVal, source: 'mobile', isOverridden };
        if (tabletVal !== undefined) return { value: tabletVal, source: 'tablet', isOverridden };
        return { value: desktopVal, source: 'desktop', isOverridden };
    }
    if (viewport === 'tablet') {
        if (tabletVal !== undefined) return { value: tabletVal, source: 'tablet', isOverridden };
        return { value: desktopVal, source: 'desktop', isOverridden };
    }
    return { value: desktopVal, source: 'desktop', isOverridden };
};

const getNativeValue = (styles: DeepReadonly<Element['styles']>, key: string) => {
    return { value: (styles.desktop as any)[key] || '', source: 'desktop', isOverridden: false }; // No overrides in native for now
};

const StyleInput: React.FC<{label: string, type: string, value: any, onChange: (value: any) => void, isViewportOverride: boolean, isComponentOverride: boolean, onReset?: () => void, suffix?: string }> = ({ label, type, value, onChange, isViewportOverride, isComponentOverride, onReset, suffix }) => {
    const colorClass = isComponentOverride ? 'text-[var(--color-primary)]' : isViewportOverride ? 'text-green-400' : 'text-[var(--color-text-secondary)]';

    return (
        <div>
            <label className={`flex items-center justify-between text-sm font-medium ${colorClass} mb-1`}>
                {label}
                {isViewportOverride && onReset && <button onClick={onReset} className="text-xs hover:underline text-gray-400">Reset</button>}
            </label>
            <div className="relative">
                <input
                    type={type}
                    value={value || ''}
                    onChange={(e) => onChange(type === 'number' ? parseFloat(e.target.value) : e.target.value)}
                    className="w-full bg-[var(--color-surface-light)] rounded-md p-2 text-sm text-white border border-[var(--color-border)]"
                />
                {suffix && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[var(--color-text-tertiary)]">{suffix}</span>}
            </div>
        </div>
    );
};


export const CollapsibleSection: React.FC<{ title: string; children: ReactNode; defaultOpen?: boolean; }> = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div>
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center justify-between w-full p-2 my-2 text-sm font-semibold text-left bg-[var(--color-surface-light)] rounded-md">
                <span>{title}</span>
                <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-0' : '-rotate-90'}`} />
            </button>
            {isOpen && <div className="space-y-3">{children}</div>}
        </div>
    );
};

export const StylePropertyEditor: React.FC<StylePropertyEditorProps> = ({ element, onStyleChange, onAiResponsiveGenerated, parentElement, mainComponentDef }) => {
    const { state: { projectType, viewport }, dispatch } = useAppContext();
    const [isLoadingResponsive, setIsLoadingResponsive] = useState(false);
    const isWeb = projectType === 'web';

    const handleStyleChangeForCurrentViewport = (style: string, value: any) => {
        const targetViewport = isWeb ? viewport : 'desktop';
        onStyleChange(style, value, targetViewport);
    };
    
    const handleResetStyle = (style: string) => {
        onStyleChange(style, undefined, viewport);
    }
    
    const handleAiResponsive = async () => {
        setIsLoadingResponsive(true);
        try {
            const styles = await generateResponsiveStylesFromDesktop(element.styles.desktop as React.CSSProperties);
            onAiResponsiveGenerated(styles);
            toast.success('Responsive styles generated!');
        } catch(e) {
            toast.error('Failed to generate responsive styles.');
        } finally {
            setIsLoadingResponsive(false);
        }
    }
    
    const getValue = (key: string) => isWeb ? getResponsiveValue(element.styles, viewport, key, mainComponentDef) : getNativeValue(element.styles, key as string);

    const renderInput = (label: string, key: string, type = 'text', suffix?: string) => {
        const { value, source, isOverridden } = getValue(key);
        return (
            <StyleInput
                label={label}
                type={type}
                value={value}
                onChange={(val) => handleStyleChangeForCurrentViewport(key, val)}
                isViewportOverride={isWeb && source !== viewport}
                isComponentOverride={!!(mainComponentDef && isOverridden)}
                onReset={isWeb && source !== viewport ? () => handleResetStyle(key) : undefined}
                suffix={suffix}
            />
        );
    };
    
    const parentDisplay = parentElement?.styles.desktop.display;

    return (
        <div className="space-y-4">
            {isWeb && (
                 <div className="flex items-center justify-between">
                    <div className="flex bg-[var(--color-surface-light)] p-1 rounded-lg">
                        {(['desktop', 'tablet', 'mobile'] as Viewport[]).map(vp => (
                            <button key={vp} onClick={() => dispatch({type: 'SET_VIEWPORT', payload: vp})} className={`px-3 py-1 text-sm rounded-md flex items-center gap-1.5 ${viewport === vp ? 'bg-[var(--color-primary)] text-white' : 'hover:bg-[var(--color-border)]'}`}>
                                {vp === 'desktop' && <Laptop size={14}/>}
                                {vp === 'tablet' && <Tablet size={14}/>}
                                {vp === 'mobile' && <Smartphone size={14}/>}
                                <span className="capitalize">{vp}</span>
                            </button>
                        ))}
                    </div>
                    <button onClick={handleAiResponsive} disabled={isLoadingResponsive} className="p-2 text-[var(--color-primary)] hover:bg-[var(--color-surface-light)] rounded-md text-xs flex items-center gap-1 disabled:opacity-50">
                        <Sparkles size={14}/> {isLoadingResponsive ? 'Generating...' : 'Auto-Responsive'}
                    </button>
                </div>
            )}
             
            {parentDisplay === 'flex' && (
                 <CollapsibleSection title="Flex Child" defaultOpen>
                    {renderInput('Flex Grow', 'flexGrow', 'number')}
                    {renderInput('Flex Shrink', 'flexShrink', 'number')}
                    {renderInput('Flex Basis', 'flexBasis')}
                    {renderInput('Align Self', 'alignSelf')}
                </CollapsibleSection>
            )}
            
            <CollapsibleSection title="Layout">
                {renderInput('Display', 'display')}
                {getValue('display').value === 'flex' && (
                    <>
                    {renderInput('Direction', 'flexDirection')}
                    {renderInput('Justify Content', 'justifyContent')}
                    {renderInput('Align Items', 'alignItems')}
                    {renderInput('Gap', 'gap')}
                    </>
                )}
            </CollapsibleSection>

            <CollapsibleSection title="Spacing">
                {renderInput('Padding', 'padding')}
                {renderInput('Margin', 'margin')}
            </CollapsibleSection>
            
            <CollapsibleSection title="Size">
                {renderInput('Width', 'width')}
                {renderInput('Height', 'height')}
                {renderInput('Min Height', 'minHeight')}
            </CollapsibleSection>

            <CollapsibleSection title="Typography">
                <ColorPicker value={getValue('color').value || ''} onChange={v => handleStyleChangeForCurrentViewport('color', v)} />
                <div className="grid grid-cols-2 gap-2 mt-3">
                    {renderInput('Font Size', 'fontSize')}
                    {renderInput('Font Weight', 'fontWeight')}
                </div>
                {renderInput('Line Height', 'lineHeight')}
                {renderInput('Text Align', 'textAlign')}
            </CollapsibleSection>

            <CollapsibleSection title="Background">
                 <ColorPicker value={getValue('backgroundColor').value || ''} onChange={v => handleStyleChangeForCurrentViewport('backgroundColor', v)} />
            </CollapsibleSection>

            <CollapsibleSection title="Borders">
                {renderInput('Border Radius', 'borderRadius')}
                {renderInput('Border', 'border')}
            </CollapsibleSection>

            <CollapsibleSection title="Effects">
                {renderInput('Opacity', 'opacity')}
                {renderInput('Box Shadow', 'boxShadow')}
            </CollapsibleSection>
        </div>
    );
};